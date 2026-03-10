/**
 * Outlook Calendar Event via Microsoft Graph API
 *
 * POST body: {
 *   user_id: string,
 *   action: 'create' | 'update' | 'delete',
 *   event_id?: string,      -- required for update/delete (Graph event ID)
 *   interview_id?: string,  -- Supabase interview ID (used to update outlook_event_id)
 *   event?: {
 *     subject: string,
 *     body?: string,
 *     start: string,        -- ISO datetime
 *     end: string,          -- ISO datetime
 *     timezone: string,     -- e.g. 'America/New_York'
 *     location?: string,
 *     attendees?: string[], -- email addresses
 *     online_meeting?: boolean,
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const GRAPH_BASE = 'https://graph.microsoft.com/v1.0'

async function getValidAccessToken(supabase: any, userId: string): Promise<string> {
  const { data: tokenRow } = await supabase
    .from('microsoft_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokenRow) throw new Error('Outlook not connected.')

  const isExpired = new Date(tokenRow.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)
  if (!isExpired) return tokenRow.access_token

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

  if (!res.ok) throw new Error('Failed to refresh token.')
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

    const { user_id, action, event_id, interview_id, event } = await req.json()

    const accessToken = await getValidAccessToken(supabase, user_id)
    const headers = {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    }

    // ── CREATE ────────────────────────────────────────────────
    if (action === 'create') {
      if (!event) throw new Error('Missing event object')

      const payload: any = {
        subject: event.subject,
        body: { contentType: 'HTML', content: event.body || event.subject },
        start: { dateTime: event.start, timeZone: event.timezone || 'America/New_York' },
        end:   { dateTime: event.end,   timeZone: event.timezone || 'America/New_York' },
      }

      if (event.location) {
        payload.location = { displayName: event.location }
      }

      if (event.attendees?.length > 0) {
        payload.attendees = event.attendees.map((email: string) => ({
          emailAddress: { address: email },
          type: 'required',
        }))
      }

      if (event.online_meeting) {
        payload.isOnlineMeeting = true
        payload.onlineMeetingProvider = 'teamsForBusiness'
      }

      const createRes = await fetch(`${GRAPH_BASE}/me/events`, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      })

      if (!createRes.ok) {
        const errText = await createRes.text()
        throw new Error(`Create event failed: ${errText}`)
      }

      const created = await createRes.json()

      // Update the interview record with the Outlook event ID
      if (interview_id) {
        await supabase.from('interviews').update({
          outlook_event_id: created.id,
          outlook_event_url: created.webLink,
          calendar_synced_at: new Date().toISOString(),
        }).eq('id', interview_id)
      }

      return new Response(JSON.stringify({
        success: true,
        event_id: created.id,
        event_url: created.webLink,
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ── UPDATE ────────────────────────────────────────────────
    if (action === 'update') {
      if (!event_id || !event) throw new Error('Missing event_id or event')

      const payload: any = {}
      if (event.subject) payload.subject = event.subject
      if (event.start)   payload.start = { dateTime: event.start, timeZone: event.timezone || 'America/New_York' }
      if (event.end)     payload.end   = { dateTime: event.end,   timeZone: event.timezone || 'America/New_York' }
      if (event.location) payload.location = { displayName: event.location }

      const updateRes = await fetch(`${GRAPH_BASE}/me/events/${event_id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(payload),
      })

      if (!updateRes.ok) {
        const errText = await updateRes.text()
        throw new Error(`Update event failed: ${errText}`)
      }

      if (interview_id) {
        await supabase.from('interviews').update({
          calendar_synced_at: new Date().toISOString(),
        }).eq('id', interview_id)
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── DELETE ────────────────────────────────────────────────
    if (action === 'delete') {
      if (!event_id) throw new Error('Missing event_id')

      const deleteRes = await fetch(`${GRAPH_BASE}/me/events/${event_id}`, {
        method: 'DELETE',
        headers,
      })

      if (!deleteRes.ok && deleteRes.status !== 404) {
        const errText = await deleteRes.text()
        throw new Error(`Delete event failed: ${errText}`)
      }

      if (interview_id) {
        await supabase.from('interviews').update({
          outlook_event_id: null,
          outlook_event_url: null,
          calendar_synced_at: null,
        }).eq('id', interview_id)
      }

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
