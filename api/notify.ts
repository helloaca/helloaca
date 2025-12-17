import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function setCors(res: VercelResponse, origin: string) {
  res.setHeader('Access-Control-Allow-Origin', origin || '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Max-Age', '86400')
}

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
      from: process.env.EMAIL_FROM || 'helloaca <noreply@helloaca.xyz>',
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
    const origin = String(req.headers.origin || '*')
    setCors(res, origin)
    if (req.method === 'OPTIONS') {
      return res.status(200).end()
    }
    const supabase = (supabaseUrl && supabaseServiceKey) ? createClient(supabaseUrl, supabaseServiceKey) : null
    const { event, userId, contractId, extra, sendOnly } = req.body || {}
    if (!event || !userId) {
      return res.status(400).json({ error: 'Missing event or userId' })
    }
    let email: string | null = null
    let profile: any = null
    if (event !== 'team_invite') {
      if (!supabase) {
        return res.status(500).json({ error: 'Supabase environment not configured' })
      }
      const { data: p } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      profile = p
      if (!profile || !profile.email) {
        return res.status(404).json({ error: 'User profile not found' })
      }
      email = profile.email as string
    }
  const base = process.env.VITE_API_ORIGIN || process.env.API_ORIGIN || 'https://helloaca.xyz'

    const checks: Record<string, boolean> = {
      analysis_complete: !!profile?.notify_analysis_complete,
      email_report: !!profile?.notify_email_reports,
      weekly_digest: !!profile?.notify_weekly_digest,
      low_credit: !!profile?.notify_low_credits,
      credit_purchase: true,
      team_invite: true
    }

    if (event !== 'team_invite' && event in checks && checks[event] === false) {
      return res.status(200).json({ skipped: true })
    }

    const templates: Record<string, { subject: string; html: string }> = {
      credit_purchase: {
        subject: 'Credits purchased successfully',
        html: (() => {
          const credits = extra?.credits ?? ''
          const reference = extra?.reference ?? ''
          const receiptUrl = `${base}/api/receipt?reference=${encodeURIComponent(reference)}`
          return `
            <h2>Thanks for your purchase</h2>
            <p>Your credits have been added to your balance.</p>
            ${credits ? `<p><strong>Credits purchased:</strong> ${credits}</p>` : ''}
            ${reference ? `<p><strong>Transaction reference:</strong> ${reference}</p>` : ''}
            ${reference ? `<p><a href="${receiptUrl}">View receipt</a></p>` : ''}
            <p><a href="${base}/dashboard">View your dashboard</a></p>
          `
        })()
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
      team_upload: {
        subject: 'New contract uploaded by a team member',
        html: (() => {
          const memberName = String(extra?.memberName || '')
          const title = String(extra?.title || '')
          return `
            <h2>New Team Upload</h2>
            <p>${memberName || 'A team member'} uploaded a new contract${title ? `: <strong>${title}</strong>` : ''}.</p>
            ${contractId ? `<p><a href="${base}/analyze/${contractId}">View Contract</a></p>` : ''}
          `
        })()
      },
      plan_upgrade: {
        subject: 'Your plan has been upgraded',
        html: (() => {
          const plan = String(extra?.plan || '')
          return `
            <h2>Congratulations on upgrading!</h2>
            <p>Your plan is now <strong>${plan.toUpperCase()}</strong>.</p>
            <p>Explore new features in your dashboard.</p>
            <p><a href="${base}/dashboard">Go to Dashboard</a></p>
          `
        })()
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
      },
      team_invite: {
        subject: 'You have been invited to join a team',
        html: ''
      }
    }

  // Do not modify credits here; this endpoint only sends emails

    const tpl = templates[event]
    if (!tpl) {
      return res.status(400).json({ error: 'Unknown event' })
    }
    if (event === 'team_invite') {
      const toEmail = String(extra?.email || '')
      const role = String(extra?.role || 'Member')
      const plan = String(extra?.plan || '')
      if (!toEmail || !/\S+@\S+\.\S+/.test(toEmail)) {
        return res.status(400).json({ error: 'Invalid invite email' })
      }
      if (supabase) {
        await supabase
          .from('team_members')
          .upsert({ owner_id: userId, member_email: toEmail, role, status: 'pending', plan_inherited: plan, updated_at: new Date().toISOString() }, { onConflict: 'owner_id,member_email' })
      }
      let linkHtml = ''
      try {
        let existing: any = null
        if (supabase) {
          const { data } = await supabase
            .from('user_profiles')
            .select('id,email')
            .eq('email', toEmail)
            .limit(1)
            .single()
          existing = data
        }
        if (existing && existing.id) {
          const acceptUrl = `${base}/settings?acceptInviteOwner=${encodeURIComponent(String(userId))}`
          linkHtml = `<p><a href="${acceptUrl}">Approve invitation</a></p><p>Already have an account. Just approve the invite.</p>`
        } else {
          const joinUrl = `${base}/register?email=${encodeURIComponent(toEmail)}`
          linkHtml = `<p><a href="${joinUrl}">Create your account to join</a></p>`
        }
      } catch {
        const joinUrl = `${base}/register?email=${encodeURIComponent(toEmail)}`
        linkHtml = `<p><a href="${joinUrl}">Create your account to join</a></p>`
      }
      const html = `
        <h2>Team Invitation</h2>
        <p>You have been invited to join a team on Helloaca.</p>
        ${plan ? `<p><strong>Plan:</strong> ${plan}</p>` : ''}
        <p><strong>Role:</strong> ${role}</p>
        ${linkHtml}
      `
      const result = await sendEmail(toEmail, tpl.subject, html)
      return res.status(200).json({ status: 'invite_sent', result })
    }
    if (event === 'credit_purchase' && !sendOnly) {
      try {
        const creditsNum = Number(extra?.credits || 0)
        if (supabase && userId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: String(userId),
              title: 'Credits purchased',
              body: `You purchased ${creditsNum} credits. Reference: ${String(extra?.reference || '')}`,
              type: 'credit_purchase',
              read: false
            })
        }
      } catch {}
    }
    if (event === 'plan_upgrade' && !sendOnly) {
      try {
        if (supabase && userId) {
          await supabase
            .from('notifications')
            .insert({
              user_id: String(userId),
              title: 'Plan upgraded',
              body: `Your plan has been upgraded to ${String(extra?.plan || '')}.`,
              type: 'system',
              read: false
            })
        }
      } catch {}
    }
    if (event === 'team_upload') {
      try {
        if (supabase && userId) {
          const { data: memberProfile } = await supabase
            .from('user_profiles')
            .select('id,email,first_name,last_name')
            .eq('id', String(userId))
            .single()
          const memberName = memberProfile ? `${memberProfile.first_name || ''} ${memberProfile.last_name || ''}`.trim() : ''
          const { data: owners } = await supabase
            .from('team_members')
            .select('owner_id')
            .eq('member_id', String(userId))
            .eq('status', 'active')
          const ownerIds = Array.isArray(owners) ? owners.map((o: any) => String(o.owner_id)).filter(Boolean) : []
          const titleText = String(extra?.title || '')
          if (ownerIds.length > 0) {
            await supabase
              .from('notifications')
              .insert(ownerIds.map((oid: string) => ({
                user_id: oid,
                title: 'New team contract uploaded',
                body: `${memberName || 'Team member'} uploaded ${titleText || 'a new contract'}.`,
                type: 'system',
                read: false
              })))
            for (const oid of ownerIds) {
              const { data: owner } = await supabase
                .from('user_profiles')
                .select('email')
                .eq('id', oid)
                .single()
              const ownerEmail = String(owner?.email || '')
              if (ownerEmail) {
                await sendEmail(ownerEmail, templates.team_upload.subject, templates.team_upload.html)
              }
            }
          }
        }
      } catch {}
    }
    const result = await sendEmail(String(email), tpl.subject, tpl.html)
    return res.status(200).json({ status: 'sent', result })
  } catch (err) {
    console.error('Notify handler error', err)
    return res.status(500).json({ error: 'Internal error' })
  }
}
