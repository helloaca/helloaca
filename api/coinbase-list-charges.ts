import type { VercelRequest, VercelResponse } from '@vercel/node'

function explorerUrl(network: string | undefined, txid: string | undefined): string | null {
  if (!network || !txid) return null
  const n = network.toLowerCase()
  if (n.includes('bitcoin') || n === 'btc') return `https://www.blockchain.com/btc/tx/${txid}`
  if (n.includes('ethereum') || n === 'eth') return `https://etherscan.io/tx/${txid}`
  if (n.includes('polygon') || n === 'matic') return `https://polygonscan.com/tx/${txid}`
  if (n.includes('litecoin') || n === 'ltc') return `https://blockchair.com/litecoin/transaction/${txid}`
  if (n.includes('dogecoin') || n === 'doge') return `https://blockchair.com/dogecoin/transaction/${txid}`
  return null
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const apiKey = process.env.COINBASE_COMMERCE_API_KEY
    if (!apiKey) {
      res.status(500).json({ error: 'Crypto not configured' })
      return
    }
    const email = (req.query?.email || req.body?.email) as string | undefined

    const r = await fetch('https://api.commerce.coinbase.com/charges', {
      headers: {
        Accept: 'application/json',
        'X-CC-Api-Key': apiKey
      }
    })
    const j = await r.json()
    const charges: any[] = Array.isArray(j?.data) ? j.data : []
    const filtered = email ? charges.filter((c) => c?.metadata?.email === email) : charges

    const out = filtered.slice(0, 50).map((c) => {
      const code = c?.code || c?.id
      const status = Array.isArray(c?.timeline) && c.timeline.length ? c.timeline[c.timeline.length - 1]?.status?.toLowerCase() : c?.status?.toLowerCase() || 'unknown'
      const amount = c?.pricing?.local?.amount || c?.local_price?.amount || null
      const currency = c?.pricing?.local?.currency || c?.local_price?.currency || 'USD'
      const created_at = c?.created_at
      let network: string | undefined
      let txid: string | undefined
      if (Array.isArray(c?.payments) && c.payments.length) {
        const p = c.payments[c.payments.length - 1]
        network = p?.network || p?.blockchain
        txid = p?.transaction_id || p?.txid
      }
      const explorer = explorerUrl(network, txid)
      return {
        method: 'crypto',
        reference: code,
        status,
        amount,
        currency,
        created_at,
        explorer_url: explorer,
        hosted_url: c?.hosted_url || null
      }
    })

    res.status(200).json({ data: out })
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch crypto history' })
  }
}