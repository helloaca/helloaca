import type { VercelRequest, VercelResponse } from '@vercel/node'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      res.status(500).json({ error: 'Webhook not configured' })
      return
    }

    const signature = req.headers['x-paystack-signature'] as string | undefined
    if (!signature) {
      res.status(400).json({ error: 'Missing signature' })
      return
    }

    const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
    const expected = crypto.createHmac('sha512', secret).update(rawBody).digest('hex')
    if (expected !== signature) {
      res.status(401).json({ error: 'Invalid signature' })
      return
    }

    const event = (req.body as any)?.event
    const data = (req.body as any)?.data

    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceRoleKey) {
      res.status(500).json({ error: 'Database not configured' })
      return
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const email = (data?.customer?.email as string) || ''
    if (!email) {
      res.status(200).json({ received: true })
      return
    }

    if (event === 'charge.success' || event === 'subscription.create') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile?.id) {
        await supabase
          .from('user_profiles')
          .update({ plan: 'pro' })
          .eq('id', profile.id)
      }

      res.status(200).json({ received: true })
      return
    }

    if (event === 'subscription.disable' || event === 'customer.subscription.disabled') {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single()

      if (profile?.id) {
        await supabase
          .from('user_profiles')
          .update({ plan: 'free' })
          .eq('id', profile.id)
      }

      res.status(200).json({ received: true })
      return
    }

    res.status(200).json({ received: true })
  } catch (e) {
    res.status(500).json({ error: 'Webhook handling error' })
  }
}