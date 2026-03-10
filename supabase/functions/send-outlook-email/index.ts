/**
 * Send Outlook Email via Microsoft Graph API
 *
 * POST body: {
 *   user_id: string,      -- Supabase user ID whose tokens to use
 *   to: string,           -- Recipient email(s), comma-separated
 *   cc?: string,          -- CC email(s)
 *   subject: string,
 *   body: string,         -- HTML or plain text
 *   is_html?: boolean,    -- default true
 *   save_log?: boolean,   -- save to sent_emails table (default true)
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenRow, error } = await supabase
    .from('microsoft_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error || !tokenRow) throw new Error('Outlook not connected. Please connect your Microsoft account first.')

  // Check if token is expired (with 5-min buffer)
  const isExpired = new Date(tokenRow.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)

  if (!isExpired) return tokenRow.access_token

  // Refresh the token
  const res = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: Deno.env.get('MICROSOFT_CLIENT_ID')!,
      client_secret: Deno.env.get('MICROSOFT_CLIENT_SECRET')!,
      grant_type: 'refresh_token',
      refresh_token: tokenRow.refresh_token,
      scope: 'openid email profile Mail.ReadWrite Mail.Send Calendars.ReadWrite offline_access',
    }),
  })

  if (!res.ok) throw new Error('Failed to refresh Microsoft token. Please reconnect your account.')

  const tokens = await res.json()
  const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

  await supabase.from('microsoft_tokens').update({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at: expiresAt,
    updated_at: new Date().toISOString(),
  }).eq('user_id', userId)

  return tokens.access_token
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, to, cc, subject, body, is_html = true, save_log = true } = await req.json()

    if (!user_id || !to || !subject || !body) {
      throw new Error('Missing required fields: user_id, to, subject, body')
    }

    const accessToken = await getValidAccessToken(supabase, user_id)

    // Build Graph API payload
    const toRecipients = to.split(',').map((email: string) => ({
      emailAddress: { address: email.trim() },
    }))

    const ccRecipients = cc
      ? cc.split(',').map((email: string) => ({ emailAddress: { address: email.trim() } }))
      : []

    const mailPayload = {
      message: {
        subject,
        body: {
          contentType: is_html ? 'HTML' : 'Text',
          content: body,
        },
        toRecipients,
        ...(ccRecipients.length > 0 && { ccRecipients }),
      },
      saveToSentItems: true,
    }

    const sendRes = await fetch('https://graph.microsoft.com/v1.0/me/sendMail', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mailPayload),
    })

    if (!sendRes.ok) {
      const errBody = await sendRes.text()
      throw new Error(`Graph API error: ${errBody}`)
    }

    // Log to sent_emails table
    if (save_log) {
      await supabase.from('sent_emails').insert({
        sent_by: user_id,
        to_address: to,
        cc_address: cc || null,
        subject,
        body,
        status: 'sent',
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
