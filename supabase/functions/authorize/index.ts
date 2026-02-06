/**
 * Supabase Edge Function — Authorization Middleware
 *
 * This function validates JWT tokens and enforces role-based access control
 * for API requests. It mirrors the frontend permission matrix so that
 * authorization is enforced at BOTH the client and server layers.
 *
 * Usage:
 *   Invoke from your frontend via supabase.functions.invoke('authorize', {
 *     body: { module: 'billing', action: 'view' }
 *   })
 *
 *   Or use as middleware in other Edge Functions by importing the helpers.
 *
 * Deploy:
 *   supabase functions deploy authorize
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// ── Permission matrix (must stay in sync with src/lib/permissions.js) ──

const PERMISSION_MATRIX: Record<string, Record<string, string>> = {
  dashboard:         { admin: 'full', sales: 'view', recruiter: 'view', hr: 'view', finance: 'view', employee: 'view' },
  pipeline:          { admin: 'full', sales: 'full', recruiter: 'view', hr: 'none', finance: 'none', employee: 'none' },
  candidates:        { admin: 'full', sales: 'view', recruiter: 'full', hr: 'view', finance: 'view', employee: 'none' },
  submissions:       { admin: 'full', sales: 'full', recruiter: 'edit', hr: 'none', finance: 'none', employee: 'none' },
  interviews:        { admin: 'full', sales: 'full', recruiter: 'view', hr: 'view', finance: 'none', employee: 'none' },
  placements:        { admin: 'full', sales: 'full', recruiter: 'view', hr: 'view', finance: 'view', employee: 'none' },
  'hr-onboarding':   { admin: 'full', sales: 'none', recruiter: 'none', hr: 'full', finance: 'none', employee: 'own' },
  payroll:           { admin: 'full', sales: 'none', recruiter: 'none', hr: 'view', finance: 'full', employee: 'own' },
  invoices:          { admin: 'full', sales: 'none', recruiter: 'none', hr: 'none', finance: 'full', employee: 'none' },
  compliance:        { admin: 'full', sales: 'none', recruiter: 'none', hr: 'full', finance: 'none', employee: 'own' },
  analytics:         { admin: 'full', sales: 'view', recruiter: 'view', hr: 'view', finance: 'view', employee: 'none' },
  settings:          { admin: 'full', sales: 'none', recruiter: 'none', hr: 'none', finance: 'none', employee: 'none' },
  profile:           { admin: 'full', sales: 'full', recruiter: 'full', hr: 'full', finance: 'full', employee: 'full' },
  'account-settings':{ admin: 'full', sales: 'none', recruiter: 'none', hr: 'limited', finance: 'limited', employee: 'none' },
  billing:           { admin: 'full', sales: 'none', recruiter: 'none', hr: 'none', finance: 'full', employee: 'none' },
}

// ── Helper functions ──

function hasAccess(role: string, module: string): boolean {
  const level = PERMISSION_MATRIX[module]?.[role]
  return !!level && level !== 'none'
}

function canEdit(role: string, module: string): boolean {
  const level = PERMISSION_MATRIX[module]?.[role]
  return level === 'full' || level === 'edit'
}

function canDelete(role: string, module: string): boolean {
  const level = PERMISSION_MATRIX[module]?.[role]
  return level === 'full'
}

// ── Audit logger ──

async function logAudit(
  supabase: ReturnType<typeof createClient>,
  entry: {
    action: string
    user_id: string
    user_email: string
    user_role: string
    module: string
    details: Record<string, unknown>
    severity: string
  }
) {
  try {
    await supabase.from('audit_logs').insert([{
      ...entry,
      details: JSON.stringify(entry.details),
      timestamp: new Date().toISOString(),
      created_at: new Date().toISOString(),
    }])
  } catch {
    // Audit logging should never block the response
    console.error('[AUDIT] Failed to log:', entry.action)
  }
}

// ── CORS headers ──

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Main handler ──

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 1. Extract and verify JWT
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    // Client with user's JWT (for auth verification)
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    // Service client for audit logging (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // 2. Get authenticated user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 3. Fetch user profile for role
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'User profile not found' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userRole = profile.role || 'employee'

    // 4. Parse request body for module and action
    const { module, action = 'view' } = await req.json()

    if (!module) {
      return new Response(
        JSON.stringify({ error: 'Module parameter is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 5. Check authorization
    const hasModuleAccess = hasAccess(userRole, module)

    if (!hasModuleAccess) {
      // Log unauthorized attempt
      await logAudit(supabaseAdmin, {
        action: 'access.unauthorized_attempt',
        user_id: user.id,
        user_email: user.email || 'unknown',
        user_role: userRole,
        module,
        details: { attemptedAction: action, method: req.method },
        severity: 'critical',
      })

      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: `Role '${userRole}' does not have access to module '${module}'`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 6. Check specific action permissions
    if (action === 'edit' && !canEdit(userRole, module)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: `Role '${userRole}' cannot edit in module '${module}'`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'delete' && !canDelete(userRole, module)) {
      return new Response(
        JSON.stringify({
          error: 'Forbidden',
          message: `Role '${userRole}' cannot delete in module '${module}'`,
        }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 7. Return authorization result
    const permissionLevel = PERMISSION_MATRIX[module]?.[userRole] || 'none'

    return new Response(
      JSON.stringify({
        authorized: true,
        user_id: user.id,
        role: userRole,
        module,
        permission_level: permissionLevel,
        can_edit: canEdit(userRole, module),
        can_delete: canDelete(userRole, module),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
