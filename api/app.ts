import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = String(req.headers.origin || '*')
  setCors(res, origin)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' })
  }

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    return res.status(500).json({ error: 'Supabase not configured' })
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey)

  const authHeader = String(req.headers.authorization || '')
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : ''

  const body = (req.body || {}) as any
  const action = String((req.method === 'GET' ? (req.query as any).action : body.action) || '')

  try {
    if (req.method === 'GET' && action === 'billing_history') {
      const email = String((req.query as any).email || '').trim().toLowerCase()
      if (!email) {
        return res.status(400).json({ error: 'Missing email' })
      }
      const fwSecret = process.env.FLUTTERWAVE_SECRET_KEY
      const ccKey = process.env.COINBASE_COMMERCE_API_KEY || process.env.VITE_COINBASE_COMMERCE_API_KEY
      const now = new Date()
      const past = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000)
      const from = past.toISOString().slice(0, 10)
      const to = now.toISOString().slice(0, 10)
      let card: any[] = []
      let crypto: any[] = []
      try {
        if (fwSecret) {
          const url = `https://api.flutterwave.com/v3/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
          const fwRes = await fetch(url, { headers: { Authorization: `Bearer ${fwSecret}` } })
          const fwJson = await fwRes.json().catch(() => null)
          if (fwRes.ok && Array.isArray(fwJson?.data)) {
            const fxNgn = Number(process.env.FLUTTERWAVE_USD_TO_NGN_RATE || process.env.FX_USD_TO_NGN || 1600)
            card = (fwJson.data as any[])
              .filter((tx: any) => String(tx?.customer_email || tx?.customer?.email || '').trim().toLowerCase() === email)
              .map((tx: any) => {
                const currency = String(tx?.currency || 'USD').toUpperCase()
                const amt = Number(tx?.amount || 0)
                const amountUsd = currency === 'USD' ? Math.max(0, amt) : (fxNgn > 0 ? Math.max(0, Math.round((amt / fxNgn) * 100) / 100) : 0)
                return {
                  reference: String(tx?.tx_ref || tx?.flw_ref || tx?.id || ''),
                  status: String(tx?.status || '').toLowerCase(),
                  amount: amountUsd,
                  currency: 'USD',
                  created_at: String(tx?.created_at || ''),
                  paid_at: String(tx?.created_at || ''),
                  method: String(tx?.payment_type || 'card').toLowerCase(),
                  explorer_url: null
                }
              })
          }
        }
      } catch {}
      try {
        if (ccKey) {
          const ccRes = await fetch('https://api.commerce.coinbase.com/charges?limit=100', {
            headers: {
              'Content-Type': 'application/json',
              'X-CC-Api-Key': ccKey,
              'X-CC-Version': '2018-03-22',
              'Accept': 'application/json'
            }
          })
          const ccJson = await ccRes.json().catch(() => null)
          if (ccRes.ok && Array.isArray(ccJson?.data)) {
            crypto = (ccJson.data as any[])
              .filter((c: any) => String(c?.metadata?.email || '').trim().toLowerCase() === email)
              .map((c: any) => {
                const timeline = Array.isArray(c?.timeline) ? c.timeline : []
                const last = timeline.length > 0 ? timeline[timeline.length - 1] : null
                const status = String(c?.status || last?.status || '').toLowerCase()
                const local = (c?.pricing?.local || {}) as any
                const amountStr = String(local?.amount || '')
                const amountNum = amountStr && !isNaN(Number(amountStr)) ? Number(amountStr) : null
                return {
                  reference: String(c?.code || c?.id || ''),
                  status,
                  amount: amountNum,
                  currency: String(local?.currency || 'USD').toUpperCase(),
                  created_at: String(c?.created_at || ''),
                  hosted_url: String(c?.hosted_url || ''),
                  explorer_url: null
                }
              })
          }
        }
      } catch {}
      return res.status(200).json({ card, crypto })
    }

    if (action === 'team_accept_invite') {
      const { userId, ownerId } = body as { userId?: string; ownerId?: string }
      if (!userId || !ownerId) {
        return res.status(400).json({ error: 'Missing userId or ownerId' })
      }
      const { data: userResult, error: userErr } = await supabase.auth.getUser(token)
      if (userErr || !userResult?.user || String(userResult.user.id) !== String(userId)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id,email')
        .eq('id', String(userId))
        .single()
      if (!profile?.email) return res.status(404).json({ error: 'User profile not found' })
      const { data: invite } = await supabase
        .from('team_members')
        .select('id,status')
        .eq('owner_id', String(ownerId))
        .eq('member_email', String(profile.email))
        .limit(1)
        .single()
      if (!invite?.id) return res.status(404).json({ error: 'No matching invite found' })
      const { error: uErr } = await supabase
        .from('team_members')
        .update({ member_id: String(userId), status: 'active', updated_at: new Date().toISOString() })
        .eq('id', String(invite.id))
      if (uErr) return res.status(500).json({ error: 'Failed to approve invite' })
      return res.status(200).json({ status: 'approved', inviteId: String(invite.id) })
    }

    if (action === 'delete_account') {
      const { userId, email } = body as { userId?: string; email?: string }
      if (!userId || !email) {
        return res.status(400).json({ error: 'Missing parameters' })
      }
      const { data: userResult, error: userErr } = await supabase.auth.getUser(token)
      if (userErr || !userResult?.user || String(userResult.user.id) !== String(userId)) {
        return res.status(401).json({ error: 'Unauthorized' })
      }
      try { await supabase.from('reports').delete().eq('user_id', String(userId)) } catch {}
      try { await supabase.from('messages').delete().eq('user_id', String(userId)) } catch {}
      try { await supabase.from('contracts').delete().eq('user_id', String(userId)) } catch {}
      try { await supabase.from('notifications').delete().eq('user_id', String(userId)) } catch {}
      try { await supabase.from('team_members').delete().eq('member_id', String(userId)) } catch {}
      try { await supabase.from('team_members').delete().eq('owner_id', String(userId)) } catch {}
      try { await supabase.from('user_profiles').delete().eq('id', String(userId)) } catch {}
      const { error: delErr } = await supabase.auth.admin.deleteUser(String(userId))
      if (delErr) return res.status(500).json({ error: 'Failed to delete user' })
      return res.status(200).json({ status: 'deleted' })
    }

    return res.status(400).json({ error: 'Unknown action' })
  } catch (err) {
    console.error('app endpoint error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
