import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { supabase } from './supabase'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getUserCredits(userId: string): number {
  try {
    const raw = localStorage.getItem(`credits_${userId}`)
    const n = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function setUserCredits(userId: string, amount: number) {
  try {
    const safe = Math.max(0, Math.floor(amount))
    localStorage.setItem(`credits_${userId}`, String(safe))
    ;(async () => {
      try {
        await supabase
          .from('user_profiles')
          .update({ credits_balance: safe, updated_at: new Date().toISOString() })
          .eq('id', userId)
      } catch { /* noop */ }
    })()
  } catch { void 0 }
}

export function addUserCredits(userId: string, amount: number): number {
  const current = getUserCredits(userId)
  const next = Math.max(0, current + Math.floor(amount))
  setUserCredits(userId, next)
  return next
}

export function consumeUserCredit(userId: string): boolean {
  const current = getUserCredits(userId)
  if (current <= 0) return false
  const next = current - 1
  setUserCredits(userId, next)
  if (next === 0) {
    try {
      const baseEnv = import.meta.env.VITE_API_ORIGIN
      const base = baseEnv && baseEnv.length > 0
        ? baseEnv
        : ((window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
            ? 'https://helloaca.xyz'
            : window.location.origin)
      fetch(`${base}/api/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event: 'low_credit', userId })
      }).catch(() => {})
    } catch { /* noop */ }
  }
  return true
}

export function markContractCredited(userId: string, contractId: string) {
  try {
    const key = `credited_contracts_${userId}`
    const raw = localStorage.getItem(key)
    const set = new Set<string>(raw ? JSON.parse(raw) : [])
    set.add(contractId)
    localStorage.setItem(key, JSON.stringify(Array.from(set)))
  } catch { void 0 }
}

export function unmarkContractCredited(userId: string, contractId: string) {
  try {
    const key = `credited_contracts_${userId}`
    const raw = localStorage.getItem(key)
    const arr: string[] = raw ? JSON.parse(raw) : []
    const next = arr.filter(id => id !== contractId)
    localStorage.setItem(key, JSON.stringify(next))
  } catch { void 0 }
}

export function refundUserCredit(userId: string, contractId?: string) {
  try {
    if (contractId) unmarkContractCredited(userId, contractId)
  } catch { void 0 }
  try {
    addUserCredits(userId, 1)
  } catch { void 0 }
}

export function isContractCredited(userId: string, contractId: string): boolean {
  try {
    const key = `credited_contracts_${userId}`
    const raw = localStorage.getItem(key)
    const arr: string[] = raw ? JSON.parse(raw) : []
    return Array.isArray(arr) && arr.includes(contractId)
  } catch {
    return false
  }
}

function monthKey(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

export function getMonthlyFreeUsage(userId: string): number {
  try {
    const key = `free_usage_${userId}_${monthKey()}`
    const raw = localStorage.getItem(key)
    const n = raw ? parseInt(raw, 10) : 0
    return Number.isFinite(n) && n >= 0 ? n : 0
  } catch {
    return 0
  }
}

export function incrementMonthlyFreeUsage(userId: string): number {
  const current = getMonthlyFreeUsage(userId)
  const next = current + 1
  try {
    const key = `free_usage_${userId}_${monthKey()}`
    localStorage.setItem(key, String(next))
  } catch { void 0 }
  return next
}

export function canUseFreeAnalysis(userId: string, limit: number = 1): boolean {
  return getMonthlyFreeUsage(userId) < limit
}

export function markFreeAnalysisUsed(userId: string): void {
  incrementMonthlyFreeUsage(userId)
}

function creditRefreshKey(userId: string): string {
  return `credits_refresh_${userId}_${monthKey()}`
}

export function refreshMonthlyCreditsForPlan(userId: string, plan: 'free'|'pro'|'team'|'business'|'enterprise'): number {
  try {
    const key = creditRefreshKey(userId)
    const done = localStorage.getItem(key)
    if (done) return getUserCredits(userId)
    if (plan === 'pro') {
      const current = getUserCredits(userId)
      const next = Math.min(10, current + 5)
      setUserCredits(userId, next)
    }
    localStorage.setItem(key, '1')
    return getUserCredits(userId)
  } catch {
    return getUserCredits(userId)
  }
}