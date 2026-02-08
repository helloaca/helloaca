import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '*')
  setCors(res, origin)
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.status(405).json({ error: 'Method Not Allowed' })
    return
  }

  try {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      res.status(200).json({ status: 'noop', reason: 'Supabase not configured' })
      return
    }
    const supabase = createClient(url, serviceKey)
    const { count, error } = await supabase
      .from('user_profiles')
      .select('id', { count: 'exact', head: true })
      .limit(0)
    if (error) {
      res.status(200).json({ status: 'ok', db: 'awake', ping: new Date().toISOString(), error: error.message })
      return
    }
    res.status(200).json({ status: 'ok', db: 'awake', ping: new Date().toISOString(), count: Number(count || 0) })
  } catch {
    res.status(200).json({ status: 'ok', db: 'awake', ping: new Date().toISOString() })
  }
}
