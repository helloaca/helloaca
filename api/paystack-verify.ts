import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS setup
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  try {
    // 1. Get Reference
    const { reference } = req.method === 'GET' 
      ? (req.query as { reference: string })
      : (req.body as { reference: string })

    if (!reference) {
      res.status(400).json({ error: 'Missing reference' })
      return
    }

    // 2. Verify with Paystack
    const secret = process.env.PAYSTACK_SECRET_KEY
    if (!secret) {
      console.error('PAYSTACK_SECRET_KEY missing')
      res.status(500).json({ error: 'Payment configuration error' })
      return
    }

    const verifyRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${secret}` }
    })
    
    const verifyJson = await verifyRes.json()

    if (!verifyRes.ok || verifyJson?.data?.status !== 'success') {
      res.status(400).json({ 
        status: 'failed', 
        message: verifyJson?.message || 'Verification failed',
        data: verifyJson?.data 
      })
      return
    }

    const data = verifyJson.data
    const email = data.customer?.email
    // Extract credits from metadata or reference
    let credits = 0
    if (data.metadata?.credits) {
      credits = Number(data.metadata.credits)
    } else if (typeof data.reference === 'string') {
      const m = data.reference.match(/^CREDITS-(\d+)-/)
      if (m) credits = parseInt(m[1], 10)
    }

    if (!credits || credits <= 0) {
      // This might be a plan subscription, not a credit purchase.
      // For now, if it's not a credit purchase, we just return success (legacy behavior check?)
      // But the user specifically complained about credits.
      // Let's assume if it's not credits, it might be handled elsewhere or we just log it.
      console.log(`No credits found in metadata/reference for ${reference}`)
      res.status(200).json({ status: 'success', message: 'No credits to add', data: verifyJson.data })
      return
    }

    // 3. Update Supabase
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      console.error('Supabase credentials missing')
      res.status(500).json({ error: 'Database configuration error' })
      return
    }

    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Get User
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('id, credits_balance, email, first_name')
      .eq('email', email)
      .single()

    if (profileError || !profile) {
      console.error('User not found for email:', email, profileError)
      res.status(404).json({ error: 'User not found' })
      return
    }

    // Update Credits
    const currentBalance = Number(profile.credits_balance) || 0
    const newBalance = currentBalance + credits

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ credits_balance: newBalance })
      .eq('id', profile.id)

    if (updateError) {
      console.error('Failed to update credits:', updateError)
      res.status(500).json({ error: 'Failed to update credits' })
      return
    }

    // 4. Create Notification in DB
    try {
      await supabase
        .from('notifications')
        .insert({
          user_id: profile.id,
          title: 'Credits purchased',
          body: `You purchased ${credits} credits. Reference: ${reference}`,
          type: 'credit_purchase',
          read: false
        })
    } catch (err) {
      console.error('Failed to create notification:', err)
      // Don't fail the request if notification fails
    }

    // 5. Send Email (Resend)
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'https://preview.helloaca.xyz'
        const receiptUrl = `${base}/api/receipt?reference=${encodeURIComponent(reference)}`
        
        const html = `
          <h2>Thanks for your purchase</h2>
          <p>Your credits have been added to your balance.</p>
          <p><strong>Credits purchased:</strong> ${credits}</p>
          <p><strong>New Balance:</strong> ${newBalance}</p>
          <p><strong>Transaction reference:</strong> ${reference}</p>
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
        console.error('Failed to send email:', err)
        // Don't fail the request if email fails
      }
    }

    // Success
    res.status(200).json({ 
      status: 'success', 
      message: 'Credits added successfully', 
      new_balance: newBalance,
      data: verifyJson.data 
    })

  } catch (e) {
    console.error('Verify handler exception:', e)
    res.status(500).json({ error: 'Internal server error' })
  }
}
