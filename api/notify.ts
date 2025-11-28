import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function sendEmail(to: string, subject: string, html: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.log('Email disabled: RESEND_API_KEY missing. Subject:', subject)
    return { ok: true, disabled: true }
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'HelloACA <noreply@helloaca.xyz>',
      to,
      subject,
      html
    })
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    console.error('Failed to send email', data)
    return { ok: false, error: data }
  }
  return { ok: true, id: data?.id }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Supabase environment not configured' })
    }
    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { event, userId, contractId, extra } = req.body || {}
    if (!event || !userId) {
      return res.status(400).json({ error: 'Missing event or userId' })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (!profile || !profile.email) {
      return res.status(404).json({ error: 'User profile not found' })
    }

    const email = profile.email as string
    const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'https://helloaca.xyz'

    const checks: Record<string, boolean> = {
      analysis_complete: !!profile.notify_analysis_complete,
      email_report: !!profile.notify_email_reports,
      weekly_digest: !!profile.notify_weekly_digest,
      low_credit: !!profile.notify_low_credits,
      credit_purchase: true
    }

    if (event in checks && checks[event] === false) {
      return res.status(200).json({ skipped: true })
    }

    const templates: Record<string, { subject: string; html: string }> = {
      credit_purchase: {
        subject: 'Credits purchased successfully',
        html: `
          <h2>Thanks for your purchase</h2>
          <p>Your credits have been added to your balance.</p>
          <p><a href="${base}/dashboard">View your dashboard</a></p>
        `
      },
      analysis_complete: {
        subject: 'Contract analysis complete',
        html: `
          <h2>Your contract analysis is complete</h2>
          <p>Click below to view the full analysis.</p>
          <p><a href="${base}/analyze/${contractId}">View analysis</a></p>
        `
      },
      email_report: {
        subject: 'Contract analysis report ready',
        html: `
          <h2>Your analysis report is ready</h2>
          <p>You can download your report from the Export Center.</p>
          <p><a href="${base}/analyze/${contractId}?tab=export">Open Export Center</a></p>
        `
      },
      weekly_digest: {
        subject: 'Weekly digest of your contract activity',
        html: `
          <h2>Weekly Digest</h2>
          <p>Here is your weekly summary of analyses and activity.</p>
          <p><a href="${base}/dashboard">Open Dashboard</a></p>
        `
      },
      low_credit: {
        subject: 'You are out of credits',
        html: `
          <h2>Credits depleted</h2>
          <p>Your credit balance has reached zero. Buy credits to unlock full analysis and exports.</p>
          <p><a href="${base}/pricing">Buy credits</a></p>
        `
      }
    }

    const tpl = templates[event]
    if (!tpl) {
      return res.status(400).json({ error: 'Unknown event' })
    }
    const result = await sendEmail(email, tpl.subject, tpl.html)
    return res.status(200).json({ status: 'sent', result })
  } catch (err) {
    console.error('Notify handler error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}