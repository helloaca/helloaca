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
    const { email, plan, reason, comeback } = req.body as { email?: string; plan?: string; reason?: string; comeback?: string }
    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.status(200).json({ status: 'noop' })
      return
    }
    const supabase = createClient(url, serviceKey)
    const { error } = await supabase.from('cancellation_feedback').insert({
      email: email || null,
      plan: plan || null,
      reason: reason || null,
      comeback: comeback || null
    })
    res.setHeader('Access-Control-Allow-Origin', '*')
    if (error) {
      // Do not block cancellation
      res.status(200).json({ status: 'error', message: error.message })
      return
    }
    res.status(200).json({ status: 'ok' })
  } catch (e) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.status(200).json({ status: 'noop' })
  }
}