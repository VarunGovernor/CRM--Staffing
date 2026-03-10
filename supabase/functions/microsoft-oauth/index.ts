/**
 * Microsoft OAuth Edge Function
 *
 * SETUP (one-time):
 *  1. Go to https://portal.azure.com → Azure Active Directory → App registrations → New
 *  2. Set redirect URI to: https://<your-app>.netlify.app/auth/microsoft/callback (or your domain)
 *  3. Under "API permissions" add: Mail.ReadWrite, Mail.Send, Calendars.ReadWrite, User.Read, offline_access
 *  4. Create a client secret under "Certificates & secrets"
 *  5. Set Supabase Edge Function secrets:
 *       supabase secrets set MICROSOFT_CLIENT_ID=<your-client-id>
 *       supabase secrets set MICROSOFT_CLIENT_SECRET=<your-client-secret>
 *       supabase secrets set MICROSOFT_REDIRECT_URI=https://<your-domain>/auth/microsoft/callback
 *
 * Routes:
 *  POST /microsoft-oauth  body: { action: 'exchange', code: string, user_id: string }
 *  POST /microsoft-oauth  body: { action: 'refresh', user_id: string }
 *  POST /microsoft-oauth  body: { action: 'revoke', user_id: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const MS_TOKEN_URL = 'https://login.microsoftonline.com/common/oauth2/v2.0/token'

async function refreshAccessToken(refreshToken: string): Promise<{ access_token: string; refresh_token: string; expires_in: number }> {
  const res = await fetch(MS_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
      client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
      scope: 'openid email profile Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access',
    }),
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Token refresh failed: ${err}`)
  }
  return res.json()
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, code, user_id } = await req.json()

    // ── Exchange auth code for tokens ─────────────────────────
    if (action === 'exchange') {
      if (!code || !user_id) throw new Error('Missing code or user_id')

      const res = await fetch(MS_TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
          client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
          grant_type: 'authorization_code',
          code,
          redirect_uri: Deno.env.get('MICROSOFT_REDIRECT_URI')!,
          scope: 'openid email profile Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access',
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`Token exchange failed: ${err}`)
      }

      const tokens = await res.json()
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      // Get Microsoft profile email
      const profileRes = await fetch('https://graph.microsoft.com/v1.0/me?$select=mail,userPrincipalName', {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      })
      const profile = profileRes.ok ? await profileRes.json() : {}
      const msEmail = profile.mail || profile.userPrincipalName || null

      await supabase.from('microsoft_tokens').upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        scope: tokens.scope,
        ms_email: msEmail,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      return new Response(JSON.stringify({ success: true, ms_email: msEmail }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Refresh token ──────────────────────────────────────────
    if (action === 'refresh') {
      if (!user_id) throw new Error('Missing user_id')

      const { data: tokenRow } = await supabase
        .from('microsoft_tokens')
        .select('refresh_token')
        .eq('user_id', user_id)
        .single()

      if (!tokenRow) throw new Error('No Microsoft token found for user')

      const tokens = await refreshAccessToken(tokenRow.refresh_token)
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      await supabase.from('microsoft_tokens').update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Revoke / disconnect ────────────────────────────────────
    if (action === 'revoke') {
      if (!user_id) throw new Error('Missing user_id')
      await supabase.from('microsoft_tokens').delete().eq('user_id', user_id)
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    throw new Error(`Unknown action: ${action}`)
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
