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
      console.error('PAYSTACK_SECRET_KEY missing')
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
      console.error('Supabase credentials missing')
      res.status(500).json({ error: 'Database not configured' })
      return
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey)

    const email = (data?.customer?.email as string) || ''
    if (!email) {
      res.status(200).json({ received: true })
      return
    }

    if (event === 'charge.success') {
      // Check if it's a credit purchase
      let credits = 0
      if (data?.metadata?.credits) {
        credits = Number(data.metadata.credits)
      } else if (typeof data?.reference === 'string') {
        const m = data.reference.match(/^CREDITS-(\d+)-/)
        if (m) credits = parseInt(m[1], 10)
      }

      const { data: profile } = await supabase
        .from('user_profiles')
        .select('id, credits_balance')
        .eq('email', email)
        .single()

      if (profile?.id) {
        if (credits > 0) {
          // It is a credit purchase.
          // Check idempotency via notifications table to see if verify endpoint already handled it
          const { data: existing } = await supabase
            .from('notifications')
            .select('id')
            .ilike('body', `%Reference: ${data.reference}%`)
            .single()

          if (!existing) {
             // Process credits
             const current = Number(profile.credits_balance) || 0
             await supabase
               .from('user_profiles')
               .update({ credits_balance: current + credits })
               .eq('id', profile.id)

             // Insert notification (marks transaction as processed)
             await supabase
               .from('notifications')
               .insert({
                 user_id: profile.id,
                 title: 'Credits purchased',
                 body: `You purchased ${credits} credits. Reference: ${data.reference}`,
                 type: 'credit_purchase',
                 read: false
               })
             
             // Try to send email (best effort)
             const resendKey = process.env.RESEND_API_KEY
             if (resendKey) {
                try {
        const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'https://preview.helloaca.xyz'
                  const receiptUrl = `${base}/api/receipt?reference=${encodeURIComponent(data.reference)}`
                  const html = `
                    <h2>Thanks for your purchase</h2>
                    <p>Your credits have been added to your balance.</p>
                    <p><strong>Credits purchased:</strong> ${credits}</p>
                    <p><strong>Transaction reference:</strong> ${data.reference}</p>
                    <p><a href="${receiptUrl}">View receipt</a></p>
                    <p><a href="${base}/dashboard">View your dashboard</a></p>
                  `
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${resendKey}`
                    },
                    body: JSON.stringify({
                      from: process.env.EMAIL_FROM || 'helloaca <noreply@helloaca.xyz>',
                      to: email,
                      subject: 'Credits purchased successfully',
                      html
                    })
                  })
                } catch (err) {
                  console.error('Webhook email error:', err)
                }
             }
          } else {
            console.log(`Transaction ${data.reference} already processed via verify endpoint.`)
          }
        } else {
          // Not credits, assume subscription upgrade (legacy behavior or specific plan metadata)
          // Ideally we should check metadata.plan, but existing code defaulted to 'pro'.
          // Let's be safer: only upgrade if plan is specified or no credits.
          const plan = data?.metadata?.plan || 'pro'
          await supabase
            .from('user_profiles')
            .update({ plan: plan })
            .eq('id', profile.id)
        }
      }

      res.status(200).json({ received: true })
      return
    }

    if (event === 'subscription.create') {
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
    console.error('Webhook handling error:', e)
    res.status(500).json({ error: 'Webhook handling error' })
  }
}
