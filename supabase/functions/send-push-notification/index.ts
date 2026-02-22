// Supabase Edge Function: send-push-notification
// Triggered via DB Webhook on notifications table INSERT.
//
// Setup in Supabase Dashboard:
//   1. Database > Webhooks > Create webhook
//      Table: notifications, Event: INSERT
//      HTTP POST → https://<project>.supabase.co/functions/v1/send-push-notification
//   2. Edge Functions > Secrets:
//      FIREBASE_SERVICE_ACCOUNT_JSON = <paste entire service account JSON as one line>
//   3. Firebase Console > Cloud Messaging > Apple app configuration:
//      Upload your APNs Auth Key (.p8) from Apple Developer portal

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── FCM V1 API: sign a JWT and exchange for OAuth2 access token ───────────────

function base64url(bytes: Uint8Array): string {
  const b64 = btoa(String.fromCharCode(...bytes))
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function getAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson)

  const now = Math.floor(Date.now() / 1000)
  const header = { alg: 'RS256', typ: 'JWT' }
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600,
  }

  const enc = (obj: unknown) =>
    base64url(new TextEncoder().encode(JSON.stringify(obj)))
  const signingInput = `${enc(header)}.${enc(payload)}`

  // Strip PEM headers and decode
  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/g, '')
    .replace(/-----END PRIVATE KEY-----/g, '')
    .replace(/\s/g, '')
  const binaryKey = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    binaryKey.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signatureBytes = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  )
  const jwt = `${signingInput}.${base64url(new Uint8Array(signatureBytes))}`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`)
  }
  return tokenData.access_token
}

// ── Main handler ─────────────────────────────────────────────────────────────

serve(async (req: Request) => {
  try {
    const body = await req.json()
    const record = body.record ?? body

    if (!record?.user_id) {
      return new Response('Missing user_id', { status: 400 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('fcm_token')
      .eq('id', record.user_id)
      .single()

    if (error || !profile?.fcm_token) {
      console.log(`[FCM] No token for user ${record.user_id}`)
      return new Response(JSON.stringify({ skipped: true }), { status: 200 })
    }

    const serviceAccountJson = Deno.env.get('FIREBASE_SERVICE_ACCOUNT_JSON')!
    const sa = JSON.parse(serviceAccountJson)
    const accessToken = await getAccessToken(serviceAccountJson)

    const fcmRes = await fetch(
      `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            token: profile.fcm_token,
            notification: {
              title: record.title ?? 'San Synapse HR',
              body: record.message ?? '',
            },
            android: { priority: 'high' },
            apns: {
              payload: { aps: { sound: 'default', badge: 1 } },
            },
            data: {
              type: record.type ?? 'general',
              notification_id: record.id ?? '',
            },
          },
        }),
      },
    )

    const fcmBody = await fcmRes.json()
    console.log('[FCM V1] Response:', JSON.stringify(fcmBody))

    return new Response(JSON.stringify({ ok: fcmRes.ok, fcm: fcmBody }), {
      status: fcmRes.ok ? 200 : 500,
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[FCM V1] Error:', err)
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 })
  }
})
