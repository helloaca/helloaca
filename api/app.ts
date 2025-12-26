 import type { VercelRequest, VercelResponse } from '@vercel/node'
 import { createClient } from '@supabase/supabase-js'
 import fs from 'fs'
 import path from 'path'
 
 let cachedLogoDataUri: string | null = null
 async function getLogoDataUri(): Promise<string> {
   if (cachedLogoDataUri) return cachedLogoDataUri
   const envB64 = String(process.env.EMAIL_LOGO_BASE64 || '').trim()
   if (envB64) {
     cachedLogoDataUri = envB64.startsWith('data:') ? envB64 : `data:image/png;base64,${envB64}`
     return cachedLogoDataUri
   }
   try {
     const p = path.join(process.cwd(), 'public', 'helloaca.png')
     const buf = fs.readFileSync(p)
     cachedLogoDataUri = `data:image/png;base64,${Buffer.from(buf).toString('base64')}`
     return cachedLogoDataUri
   } catch {}
   try {
     const r = await fetch('https://helloaca.xyz/helloaca.png')
     const ab = await r.arrayBuffer()
     cachedLogoDataUri = `data:image/png;base64,${Buffer.from(ab as ArrayBuffer).toString('base64')}`
     return cachedLogoDataUri
   } catch {}
   cachedLogoDataUri = ''
   return cachedLogoDataUri
 }

function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Token, X-Admin-Email')
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
  const adminHeader = String((req.headers as any)['x-admin-token'] || '')
  const adminEmailHeader = String((req.headers as any)['x-admin-email'] || '')
  const adminTokenEnv = String(process.env.ADMIN_API_TOKEN || '')
  const allowedAdminEmail = String(process.env.ADMIN_ALLOWED_EMAIL || process.env.ADMIN_EMAIL || 'ozoemenachidile@gmail.com')

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

    if (action === 'admin_token') {
      const { email, password } = body as { email?: string; password?: string }
      const adminPass = String(process.env.ADMIN_PASSWORD || '')
      if (!email || !password) return res.status(400).json({ error: 'Missing email or password' })
      if (!adminPass || !adminTokenEnv) return res.status(500).json({ error: 'Admin not configured' })
      if (String(email).toLowerCase() !== allowedAdminEmail.toLowerCase()) return res.status(401).json({ error: 'Unauthorized' })
      if (password !== adminPass) return res.status(401).json({ error: 'Unauthorized' })
      return res.status(200).json({ token: adminTokenEnv })
    }

    if (req.method === 'GET' && action === 'admin_metrics') {
      if (!adminTokenEnv || adminHeader !== adminTokenEnv || (adminEmailHeader && adminEmailHeader.toLowerCase() !== allowedAdminEmail.toLowerCase())) return res.status(401).json({ error: 'Unauthorized' })
      const fwSecret = process.env.FLUTTERWAVE_SECRET_KEY
      const ccKey = process.env.COINBASE_COMMERCE_API_KEY || process.env.VITE_COINBASE_COMMERCE_API_KEY
      const now = new Date()
      const past = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      const from = String(((req.query as any).from || past.toISOString().slice(0,10)))
      const to = String(((req.query as any).to || now.toISOString().slice(0,10)))
      let revenueCard = 0
      let txCardCount = 0
      let revenueCrypto = 0
      let txCryptoCount = 0
      try {
        if (fwSecret) {
          const url = `https://api.flutterwave.com/v3/transactions?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
          const fwRes = await fetch(url, { headers: { Authorization: `Bearer ${fwSecret}` } })
          const fwJson = await fwRes.json().catch(() => null)
          if (fwRes.ok && Array.isArray(fwJson?.data)) {
            const fxNgn = Number(process.env.FLUTTERWAVE_USD_TO_NGN_RATE || process.env.FX_USD_TO_NGN || 1600)
            for (const tx of fwJson.data as any[]) {
              const currency = String(tx?.currency || 'USD').toUpperCase()
              const amt = Number(tx?.amount || 0)
              const usd = currency === 'USD' ? Math.max(0, amt) : (fxNgn > 0 ? Math.max(0, Math.round((amt / fxNgn) * 100) / 100) : 0)
              revenueCard += usd
            }
            txCardCount = (fwJson.data as any[]).length
          }
        }
      } catch {}
      try {
        if (ccKey) {
          const ccRes = await fetch('https://api.commerce.coinbase.com/charges?limit=100', {
            headers: { 'Content-Type': 'application/json', 'X-CC-Api-Key': ccKey, 'X-CC-Version': '2018-03-22', 'Accept': 'application/json' }
          })
          const ccJson = await ccRes.json().catch(() => null)
          if (ccRes.ok && Array.isArray(ccJson?.data)) {
            for (const c of ccJson.data as any[]) {
              const local = (c?.pricing?.local || {}) as any
              const currency = String(local?.currency || 'USD').toUpperCase()
              const amountStr = String(local?.amount || '')
              const amountNum = amountStr && !isNaN(Number(amountStr)) ? Number(amountStr) : 0
              if (currency === 'USD') revenueCrypto += amountNum
            }
            txCryptoCount = (ccJson.data as any[]).length
          }
        }
      } catch {}
      let usersTotal = 0
      let usersActive = 0
      try {
        const { count: totalCount } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true })
        usersTotal = Number(totalCount || 0)
        const { count: activeCount } = await supabase.from('user_profiles').select('id', { count: 'exact', head: true }).or('plan.eq.pro,plan.eq.team,plan.eq.business,plan.eq.enterprise,credits_balance.gt.0')
        usersActive = Number(activeCount || 0)
      } catch {}
      let reportsTotal = 0
      let messagesTotal = 0
      let contactsTotal = 0
      let notificationsTotal = 0
      let usageDaily: Array<{ date: string; reports: number; messages: number }> = []
      let usageMonthly: Array<{ month: string; reports: number; messages: number }> = []
      let usageYearly: Array<{ year: string; reports: number; messages: number }> = []
      try {
        const since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        const { data: reports } = await supabase.from('reports').select('created_at').gte('created_at', since).order('created_at', { ascending: true })
        const { data: messages } = await supabase.from('messages').select('created_at').gte('created_at', since).order('created_at', { ascending: true })
        const { count: repCount } = await supabase.from('reports').select('id', { count: 'exact', head: true })
        reportsTotal = Number(repCount || 0)
        const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true })
        messagesTotal = Number(msgCount || 0)
        const { count: conCount } = await supabase.from('contact_submissions').select('id', { count: 'exact', head: true })
        contactsTotal = Number(conCount || 0)
        const { count: notifCount } = await supabase.from('notifications').select('id', { count: 'exact', head: true })
        notificationsTotal = Number(notifCount || 0)
        const mapDay = new Map<string, { r: number; m: number }>()
        const mapMonth = new Map<string, { r: number; m: number }>()
        const mapYear = new Map<string, { r: number; m: number }>()
        for (const row of Array.isArray(reports) ? reports : []) {
          const d = new Date(String((row as any).created_at))
          const day = d.toISOString().slice(0,10)
          const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
          const year = `${d.getUTCFullYear()}`
          const dv = mapDay.get(day) || { r: 0, m: 0 }
          dv.r += 1
          mapDay.set(day, dv)
          const mv = mapMonth.get(month) || { r: 0, m: 0 }
          mv.r += 1
          mapMonth.set(month, mv)
          const yv = mapYear.get(year) || { r: 0, m: 0 }
          yv.r += 1
          mapYear.set(year, yv)
        }
        for (const row of Array.isArray(messages) ? messages : []) {
          const d = new Date(String((row as any).created_at))
          const day = d.toISOString().slice(0,10)
          const month = `${d.getUTCFullYear()}-${String(d.getUTCMonth()+1).padStart(2,'0')}`
          const year = `${d.getUTCFullYear()}`
          const dv = mapDay.get(day) || { r: 0, m: 0 }
          dv.m += 1
          mapDay.set(day, dv)
          const mv = mapMonth.get(month) || { r: 0, m: 0 }
          mv.m += 1
          mapMonth.set(month, mv)
          const yv = mapYear.get(year) || { r: 0, m: 0 }
          yv.m += 1
          mapYear.set(year, yv)
        }
        usageDaily = Array.from(mapDay.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([date, v]) => ({ date, reports: v.r, messages: v.m }))
        usageMonthly = Array.from(mapMonth.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([month, v]) => ({ month, reports: v.r, messages: v.m }))
        usageYearly = Array.from(mapYear.entries()).sort((a,b) => a[0].localeCompare(b[0])).map(([year, v]) => ({ year, reports: v.r, messages: v.m }))
      } catch {}
      return res.status(200).json({
        totals: {
          revenue_card_usd: Math.round(revenueCard * 100) / 100,
          revenue_crypto_usd: Math.round(revenueCrypto * 100) / 100,
          revenue_total_usd: Math.round((revenueCard + revenueCrypto) * 100) / 100,
          users_total: usersTotal,
          users_active: usersActive,
          reports_total: reportsTotal,
          messages_total: messagesTotal,
          contacts_total: contactsTotal,
          notifications_total: notificationsTotal,
          transactions_card_count: txCardCount,
          transactions_crypto_count: txCryptoCount
        },
        usage: { daily: usageDaily, monthly: usageMonthly, yearly: usageYearly },
        page_views: []
      })
    }

    if (action === 'admin_notify') {
      if (!adminTokenEnv || adminHeader !== adminTokenEnv || (adminEmailHeader && adminEmailHeader.toLowerCase() !== allowedAdminEmail.toLowerCase())) return res.status(401).json({ error: 'Unauthorized' })
      const { userIds, emails, title, body: notifBody, type, broadcast } = body as { userIds?: string[]; emails?: string[]; title?: string; body?: string; type?: string; broadcast?: boolean }
      if (!title || !notifBody) return res.status(400).json({ error: 'Missing title or body' })
      let targets: string[] = Array.isArray(userIds) ? userIds.filter(Boolean) : []
      try {
        if (broadcast) {
          const { data } = await supabase.from('user_profiles').select('id')
          targets = Array.isArray(data) ? data.map((r: any) => String(r.id)).filter(Boolean) : targets
        } else if (Array.isArray(emails) && emails.length > 0) {
          const { data } = await supabase.from('user_profiles').select('id,email').in('email', emails.map(e => String(e).toLowerCase()))
          const ids = Array.isArray(data) ? data.map((r: any) => String(r.id)).filter(Boolean) : []
          targets = [...targets, ...ids]
        }
      } catch {}
      if (targets.length === 0) return res.status(400).json({ error: 'No targets' })
      const rows = targets.map(id => ({ user_id: id, title, body: notifBody, type: String(type || 'system'), read: false }))
      const { error } = await supabase.from('notifications').insert(rows)
      if (error) return res.status(500).json({ error: 'Failed to send notifications' })
      return res.status(200).json({ sent: targets.length })
    }

     if (action === 'admin_email') {
      if (!adminTokenEnv || adminHeader !== adminTokenEnv || (adminEmailHeader && adminEmailHeader.toLowerCase() !== allowedAdminEmail.toLowerCase())) return res.status(401).json({ error: 'Unauthorized' })
      const { emails, userIds, subject, html } = body as { emails?: string[]; userIds?: string[]; subject?: string; html?: string }
      if (!subject || !html) return res.status(400).json({ error: 'Missing subject or html' })
      let toList: string[] = Array.isArray(emails) ? emails.filter(e => /\S+@\S+\.\S+/.test(String(e))) : []
      if (Array.isArray(userIds) && userIds.length > 0) {
        const { data } = await supabase.from('user_profiles').select('email').in('id', userIds)
        const es = Array.isArray(data) ? data.map((r: any) => String(r.email)).filter(e => /\S+@\S+\.\S+/.test(e)) : []
        toList = [...toList, ...es]
      }
      toList = Array.from(new Set(toList))
      if (toList.length === 0) return res.status(400).json({ error: 'No recipients' })
      const apiKey = process.env.RESEND_API_KEY
      if (!apiKey) return res.status(500).json({ error: 'Email not configured' })
      let ok = 0
      const logo = await getLogoDataUri()
      const finalHtml = logo ? `<div style="font-family:Inter,Arial,sans-serif;color:#111827"><div style="margin:0 0 12px"><img src="${logo}" alt="helloaca" style="width:120px;height:auto;display:block"></div>${html}</div>` : html
      for (const to of toList) {
        try {
          const r = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({ from: process.env.EMAIL_FROM || 'helloaca <noreply@helloaca.xyz>', to, subject, html: finalHtml })
          })
          if (r.ok) ok += 1
        } catch {}
      }
      return res.status(200).json({ sent: ok, requested: toList.length })
    }

    if (action === 'admin_set_credits') {
      if (!adminTokenEnv || adminHeader !== adminTokenEnv || (adminEmailHeader && adminEmailHeader.toLowerCase() !== allowedAdminEmail.toLowerCase())) return res.status(401).json({ error: 'Unauthorized' })
      const { userId, email, amount, mode } = body as { userId?: string; email?: string; amount?: number; mode?: 'set'|'add' }
      if ((!userId && !email) || typeof amount !== 'number') return res.status(400).json({ error: 'Missing parameters' })
      let targetId: string | null = null
      if (userId) targetId = String(userId)
      else {
        const { data } = await supabase.from('user_profiles').select('id').eq('email', String(email)).limit(1).single()
        targetId = String(data?.id || '')
      }
      if (!targetId) return res.status(404).json({ error: 'User not found' })
      const { data: profile } = await supabase.from('user_profiles').select('id,credits_balance,email').eq('id', targetId).single()
      const current = Number(profile?.credits_balance || 0)
      const next = mode === 'set' ? Number(amount) : current + Number(amount)
      await supabase.from('user_profiles').update({ credits_balance: next }).eq('id', targetId)
      try { await supabase.from('notifications').insert({ user_id: targetId, title: 'Credits rewarded', body: `You have been rewarded with ${Number(amount)} credit(s).`, type: 'system', read: false }) } catch {}
       try {
        const apiKey = process.env.RESEND_API_KEY
        if (apiKey && profile?.email && /\S+@\S+\.\S+/.test(String(profile.email))) {
          const logo = await getLogoDataUri()
          const head = logo ? `<div style="margin:0 0 12px"><img src="${logo}" alt="helloaca" style="width:120px;height:auto;display:block"></div>` : ''
          await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
            body: JSON.stringify({
              from: process.env.EMAIL_FROM || 'helloaca <noreply@helloaca.xyz>',
              to: String(profile.email),
              subject: 'Credits rewarded',
              html: `<div style="font-family:Inter,Arial,sans-serif;color:#111827">${head}<h2 style="margin:0 0 8px">Credits rewarded</h2><p style="margin:0">Your account has been credited with <strong>${Number(amount)}</strong> credit(s).</p><p style="margin:12px 0 0">Thank you for using Helloaca.</p></div>`
            })
          })
        }
      } catch {}
      return res.status(200).json({ userId: targetId, new_balance: next })
    }

    if (req.method === 'GET' && action === 'admin_contacts') {
      if (!adminTokenEnv || adminHeader !== adminTokenEnv || (adminEmailHeader && adminEmailHeader.toLowerCase() !== allowedAdminEmail.toLowerCase())) return res.status(401).json({ error: 'Unauthorized' })
      const { data } = await supabase.from('contact_submissions').select('*').order('created_at', { ascending: false }).limit(200)
      return res.status(200).json({ contacts: Array.isArray(data) ? data : [] })
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
