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
    if (!userId || !email) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(400).json({ error: 'Missing user data' })
      return
    }

    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Supabase not configured' })
      return
    }

    const supabase = createClient(url, serviceKey)

    await supabase.from('contracts').delete().eq('user_id', userId)
    await supabase.from('reports').delete().eq('user_id', userId)
    await supabase.from('user_profiles').delete().eq('id', userId)

    const { error: delErr } = await supabase.auth.admin.deleteUser(userId)
    if (delErr) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(500).json({ error: 'Failed to delete user' })
      return
    }

    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({ status: 'ok' })
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(500).json({ error: 'Deletion error' })
  }
}