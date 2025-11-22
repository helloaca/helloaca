import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
    res.status(200).end()
    return
  }
  if (req.method !== 'POST') {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(405).json({ error: 'Method not allowed' })
    return
  }
  try {
    const { userId, email } = req.body as { userId?: string; email?: string }
    if (!userId) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing userId' })
      return
    }

    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Supabase not configured' })
      return
    }

    const supabase = createClient(url, serviceKey)

    const deletions = [
      (async () => await supabase.from('messages').delete().eq('user_id', userId))(),
      (async () => await supabase.from('contracts').delete().eq('user_id', userId))(),
      (async () => await supabase.from('reports').delete().eq('user_id', userId))(),
      (async () => await supabase.from('user_profiles').delete().eq('id', userId))()
    ]
    if (email) {
      deletions.push((async () => await supabase.from('cancellation_feedback').delete().eq('email', email))())
    }

    const results = await Promise.allSettled(deletions)

    const adminDelete = await supabase.auth.admin.deleteUser(userId)

    res.setHeader('Access-Control-Allow-Origin', '*')
    if (adminDelete.error) {
      res.status(500).json({ error: adminDelete.error.message, details: results })
      return
    }

    res.status(200).json({ status: 'ok' })
  } catch (e: any) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: e?.message || 'Delete account error' })
  }
}