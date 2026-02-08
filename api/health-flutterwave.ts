import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    const status = {
      flutterwave_public_key: !!process.env.FLUTTERWAVE_PUBLIC_KEY,
      flutterwave_secret_key: !!process.env.FLUTTERWAVE_SECRET_KEY,
      flutterwave_encryption_key: !!process.env.FLUTTERWAVE_ENCRYPTION_KEY,
      flutterwave_webhook_secret: !!(process.env.FLUTTERWAVE_WEBHOOK_SECRET || process.env.FLW_WEBHOOK_SECRET),
      supabase_url: !!(process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL),
      supabase_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }
    res.status(200).json({ status })
  } catch (e) {
    res.status(500).json({ error: 'Internal server error' })
  }
}

