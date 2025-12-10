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
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      return res.status(500).json({ error: 'Supabase environment not configured' })
    }
    const supabase = createClient(supabaseUrl, serviceRoleKey)
    const { userId, ownerId } = (req.body || {}) as { userId?: string; ownerId?: string }
    if (!userId || !ownerId) {
      return res.status(400).json({ error: 'Missing userId or ownerId' })
    }
    const { data: profile, error: pErr } = await supabase
      .from('user_profiles')
      .select('id,email')
      .eq('id', String(userId))
      .single()
    if (pErr || !profile?.email) {
      return res.status(404).json({ error: 'User profile not found' })
    }
    const { data: invite, error: iErr } = await supabase
      .from('team_members')
      .select('id,status')
      .eq('owner_id', String(ownerId))
      .eq('member_email', String(profile.email))
      .limit(1)
      .single()
    if (iErr || !invite?.id) {
      return res.status(404).json({ error: 'No matching invite found' })
    }
    const { error: uErr } = await supabase
      .from('team_members')
      .update({ member_id: String(userId), status: 'active', updated_at: new Date().toISOString() })
      .eq('id', String(invite.id))
    if (uErr) {
      return res.status(500).json({ error: 'Failed to approve invite' })
    }
    return res.status(200).json({ status: 'approved', inviteId: String(invite.id) })
  } catch (err) {
    console.error('team-accept-invite error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}

