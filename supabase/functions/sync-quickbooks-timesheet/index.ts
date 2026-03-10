/**
 * Sync timesheet / invoice to QuickBooks Online
 *
 * POST body: {
 *   user_id: string,       -- admin user whose QB tokens to use
 *   invoice_id: string,    -- Supabase invoice ID to sync
 * }
 *
 * Creates a TimeActivity in QBO for C2C contractors.
 * For W2, creates a JournalEntry or Vendor Bill.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const QB_BASE_PROD    = 'https://quickbooks.api.intuit.com/v3/company'
const QB_BASE_SANDBOX = 'https://sandbox-quickbooks.api.intuit.com/v3/company'

async function getQBClient(supabase: any, userId: string) {
  const { data: tokenRow } = await supabase
    .from('quickbooks_tokens')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (!tokenRow) throw new Error('QuickBooks not connected. Please connect your QuickBooks account.')

  const isExpired = new Date(tokenRow.expires_at) <= new Date(Date.now() + 5 * 60 * 1000)

  let accessToken = tokenRow.access_token

  if (isExpired) {
    const QB_TOKEN_URL = 'https://oauth.platform.intuit.com/oauth2/v1/tokens/bearer'
    const credentials = `${Deno.env.get('QB_CLIENT_ID')}:${Deno.env.get('QB_CLIENT_SECRET')}`
    const res = await fetch(QB_TOKEN_URL, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${btoa(credentials)}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: tokenRow.refresh_token,
      }),
    })

    if (!res.ok) throw new Error('Failed to refresh QuickBooks token. Please reconnect.')
    const tokens = await res.json()
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString()

    await supabase.from('quickbooks_tokens').update({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }).eq('user_id', userId)

    accessToken = tokens.access_token
  }

  const isSandbox = Deno.env.get('QB_ENVIRONMENT') === 'sandbox'
  const base = isSandbox ? QB_BASE_SANDBOX : QB_BASE_PROD

  return {
    realmId: tokenRow.realm_id,
    baseUrl: `${base}/${tokenRow.realm_id}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { user_id, invoice_id } = await req.json()

    if (!user_id || !invoice_id) throw new Error('Missing user_id or invoice_id')

    // Load invoice with candidate + placement
    const { data: invoice, error: invErr } = await supabase
      .from('invoices')
      .select(`
        *,
        candidate:candidates(first_name, last_name, email),
        placement:placements(job_title, client_name, offer_type)
      `)
      .eq('id', invoice_id)
      .single()

    if (invErr || !invoice) throw new Error('Invoice not found')
    if (invoice.qb_synced_at) throw new Error('This invoice has already been synced to QuickBooks.')

    const qb = await getQBClient(supabase, user_id)

    const candidateName = `${invoice.candidate?.first_name || ''} ${invoice.candidate?.last_name || ''}`.trim()
    const periodStart = invoice.period_start || invoice.invoice_date
    const periodEnd   = invoice.period_end   || invoice.invoice_date

    // Create a Purchase (Bill) in QBO representing the payment to the contractor
    const billPayload = {
      PaymentType: 'Check',
      Line: [
        {
          Amount: invoice.net_pay || invoice.gross_earnings || 0,
          DetailType: 'AccountBasedExpenseLineDetail',
          AccountBasedExpenseLineDetail: {
            AccountRef: { name: 'Contract Labor', value: '1' },
            BillableStatus: 'NotBillable',
          },
          Description: `Invoice ${invoice.invoice_number} — ${candidateName} — ${invoice.placement?.job_title || ''} (${periodStart} to ${periodEnd})`,
        },
      ],
      VendorRef: { name: candidateName },
      TxnDate: invoice.invoice_date,
      DocNumber: invoice.invoice_number,
      PrivateNote: `ByteForce IT CRM | Placement: ${invoice.placement?.client_name || ''} | Hours: ${invoice.hours_worked || 0}`,
    }

    const createRes = await fetch(`${qb.baseUrl}/purchase`, {
      method: 'POST',
      headers: qb.headers,
      body: JSON.stringify(billPayload),
    })

    if (!createRes.ok) {
      const errText = await createRes.text()
      // Store error in DB
      await supabase.from('invoices').update({
        qb_sync_error: `QB error: ${errText}`,
      }).eq('id', invoice_id)
      throw new Error(`QuickBooks API error: ${errText}`)
    }

    const qbResponse = await createRes.json()
    const qbEntityId = qbResponse?.Purchase?.Id || qbResponse?.id || 'synced'

    // Mark invoice as synced
    await supabase.from('invoices').update({
      qb_synced_at: new Date().toISOString(),
      qb_entity_id: qbEntityId,
      qb_sync_error: null,
    }).eq('id', invoice_id)

    return new Response(JSON.stringify({ success: true, qb_entity_id: qbEntityId }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
