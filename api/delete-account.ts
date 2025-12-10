import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '*')
  setCors(res, origin)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }
  try {
    const authHeader = String(req.headers.authorization || '')
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase not configured' })
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const { userId, email } = (req.body || {}) as { userId?: string; email?: string }
    if (!userId || !email) {
      return res.status(400).json({ error: 'Missing parameters' })
    }

    // Verify user token
    const { data: userResult, error: userErr } = await supabase.auth.getUser(token)
    if (userErr || !userResult?.user || String(userResult.user.id) !== String(userId)) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    // Clean up user-related data (best-effort)
    try { await supabase.from('reports').delete().eq('user_id', String(userId)) } catch {}
    try { await supabase.from('messages').delete().eq('user_id', String(userId)) } catch {}
    try { await supabase.from('contracts').delete().eq('user_id', String(userId)) } catch {}
    try { await supabase.from('notifications').delete().eq('user_id', String(userId)) } catch {}
    try { await supabase.from('team_members').delete().eq('member_id', String(userId)) } catch {}
    try { await supabase.from('team_members').delete().eq('owner_id', String(userId)) } catch {}
    try { await supabase.from('user_profiles').delete().eq('id', String(userId)) } catch {}

    // Delete auth user
    const { error: delErr } = await supabase.auth.admin.deleteUser(String(userId))
    if (delErr) {
      return res.status(500).json({ error: 'Failed to delete user' })
    }

    return res.status(200).json({ status: 'deleted' })
  } catch (err) {
    console.error('delete-account error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

