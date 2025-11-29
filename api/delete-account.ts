import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl) {
      res.status(500).json({ error: 'Missing SUPABASE_URL' })
      return
    }
    if (!serviceKey) {
      res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' })
      return
    }

    const admin = createClient(supabaseUrl, serviceKey)

    const authHeader = req.headers['authorization'] || req.headers['Authorization']
    let token = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
      ? authHeader.slice('Bearer '.length)
      : undefined
    if (!token && req.body && typeof req.body.token === 'string') {
      token = req.body.token
    }

    if (!token) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { data: userData, error: userErr } = await admin.auth.getUser(token)
    if (userErr) {
      res.status(401).json({ error: 'Invalid token', details: userErr.message })
      return
    }
    if (!userData?.user?.id) {
      res.status(401).json({ error: 'Invalid token', details: 'No user in token' })
      return
    }
    const userId = userData.user.id

    const { data: contractRows } = await admin
      .from('contracts')
      .select('id')
      .eq('user_id', userId)

    const contractIds = (contractRows || []).map(r => r.id)

    await admin
      .from('messages')
      .delete()
      .eq('user_id', userId)

    if (contractIds.length > 0) {
      await admin
        .from('messages')
        .delete()
        .in('contract_id', contractIds)
      await admin
        .from('chat_messages')
        .delete()
        .in('contract_id', contractIds)
    }

    await admin
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)

    await admin
      .from('reports')
      .delete()
      .eq('user_id', userId)

    await admin
      .from('contracts')
      .delete()
      .eq('user_id', userId)

    await admin
      .from('user_profiles')
      .delete()
      .eq('id', userId)

    const { error: delErr } = await admin.auth.admin.deleteUser(userId)
    if (delErr) {
      res.status(500).json({ error: 'Failed to delete auth user' })
      return
    }

    res.status(200).json({ status: 'deleted' })
  } catch (err) {
    res.status(500).json({ error: 'Internal error' })
  }
}