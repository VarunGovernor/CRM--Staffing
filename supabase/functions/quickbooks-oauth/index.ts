/**
 * QuickBooks OAuth Edge Function
 *
 * SETUP (one-time):
 *  1. Go to https://developer.intuit.com → Create App → QuickBooks Online + Payments
 *  2. Under Keys & OAuth, note Client ID and Client Secret
 *  3. Add redirect URI: https://<your-domain>/auth/quickbooks/callback
 *  4. Set Supabase Edge Function secrets:
 *       supabase secrets set QB_CLIENT_ID=<your-client-id>
 *       supabase secrets set QB_CLIENT_SECRET=<your-client-secret>
 *       supabase secrets set QB_REDIRECT_URI=https://<your-domain>/auth/quickbooks/callback
 *       supabase secrets set QB_ENVIRONMENT=production  (or 'sandbox' for testing)
 *
 * Routes:
 *  POST /quickbooks-oauth  body: { action: 'exchange', code, realm_id, user_id }
 *  POST /quickbooks-oauth  body: { action: 'refresh', user_id }
 *  POST /quickbooks-oauth  body: { action: 'revoke', user_id }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'

function basicAuthHeader(): string {
  const credentials = `${Deno.env.get('QB_CLIENT_ID')}:${Deno.env.get('QB_CLIENT_SECRET')}`
  return `Basic ${btoa(credentials)}`
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { action, code, realm_id, user_id } = await req.json()

    // ── Exchange auth code for tokens ─────────────────────────
    if (action === 'exchange') {
      if (!code || !realm_id || !user_id) throw new Error('Missing code, realm_id, or user_id')

      const res = await fetch(QB_TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: basicAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: Deno.env.get('QB_REDIRECT_URI')!,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`QB token exchange failed: ${err}`)
      }

      const tokens = await res.json()
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      await supabase.from('quickbooks_tokens').upsert({
        user_id,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        realm_id,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      return new Response(JSON.stringify({ success: true, realm_id }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Refresh token ──────────────────────────────────────────
    if (action === 'refresh') {
      if (!user_id) throw new Error('Missing user_id')

      const { data: tokenRow } = await supabase
        .from('quickbooks_tokens')
        .select('refresh_token')
        .eq('user_id', user_id)
        .single()

      if (!tokenRow) throw new Error('No QuickBooks token found for user')

      const res = await fetch(QB_TOKEN_URL, {
        method: 'POST',
        headers: {
          Authorization: basicAuthHeader(),
          'Content-Type': 'application/x-www-form-urlencoded',
          Accept: 'application/json',
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: tokenRow.refresh_token,
        }),
      })

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`QB token refresh failed: ${err}`)
      }

      const tokens = await res.json()
      const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

      await supabase.from('quickbooks_tokens').update({
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: expiresAt,
        updated_at: new Date().toISOString(),
      }).eq('user_id', user_id)

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── Revoke ─────────────────────────────────────────────────
    if (action === 'revoke') {
      if (!user_id) throw new Error('Missing user_id')
      await supabase.from('quickbooks_tokens').delete().eq('user_id', user_id)
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
