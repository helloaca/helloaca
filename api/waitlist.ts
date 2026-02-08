import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  if (req.method === 'OPTIONS') { res.status(200).end(); return }
  if (req.method !== 'POST') { res.status(405).json({ error: 'Method not allowed' }); return }

  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) { res.status(500).json({ error: 'Database configuration error' }); return }

    const { name, email, plans, userId, source } = req.body as any
    if (!email || !Array.isArray(plans) || plans.length === 0) { res.status(400).json({ error: 'Missing email or plans' }); return }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    let inserted = false
    try {
      const { error } = await supabase
        .from('waitlist_signups')
        .insert({ name: String(name || ''), email: String(email), plans, user_id: userId || null, source: source || 'pricing' })
      if (!error) inserted = true
    } catch {}

    if (!inserted) {
      try {
        await supabase.from('notifications').insert({
          user_id: userId || null,
          title: 'Waitlist signup',
          body: `Name: ${name || ''} Email: ${email} Plans: ${(plans || []).join(', ')}`,
          type: 'system',
          read: false
        })
        inserted = true
      } catch {}
    }

    if (inserted) {
      res.status(200).json({ status: 'success' })
    } else {
      res.status(500).json({ error: 'Failed to save waitlist signup' })
    }
  } catch (e) {
    console.error('waitlist error', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}

