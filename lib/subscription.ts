import { getCurrentUser } from './auth'
import { supabase } from './supabase'
import { saveRegenRecord, loadRegenRecord } from './db'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { isPremiumActive } from './revenuecat'

export type Tier = 'free' | 'registered' | 'premium'

export const TIER_LIMITS = {
  free:       { regensPerMonth: 2 },
  registered: { regensPerMonth: Infinity },
  premium:    { regensPerMonth: Infinity },
}

export const TIER_FEATURES: Record<Tier, Record<string, boolean>> = {
  free:       { regen: true, favorites: false, swap: false, history: false, ai: false, export: false },
  registered: { regen: true, favorites: true,  swap: true,  history: true,  ai: false, export: false },
  premium:    { regen: true, favorites: true,  swap: true,  history: true,  ai: true,  export: true  },
}

/**
 * Determine the user's current tier.
 * First checks RevenueCat entitlement (source of truth),
 * falls back to the cached isPremium flag from the profile.
 */
export async function getUserTier(isPremium?: boolean): Promise<Tier> {
  const user = await getCurrentUser()
  if (!user) return 'free'
  // Check live entitlement from RevenueCat
  const rcPremium = await isPremiumActive().catch(() => false)
  if (rcPremium || isPremium) return 'premium'
  return 'registered'
}

// ─── Regen counter (for free tier) ────────────────────────────────────────────

function currentYearMonth() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export async function getRemainingRegens(): Promise<number> {
  const ym = currentYearMonth()
  const rec = await loadRegenRecord()
  if (!rec || rec.yearMonth !== ym) return TIER_LIMITS.free.regensPerMonth
  return Math.max(0, TIER_LIMITS.free.regensPerMonth - rec.count)
}

export async function incrementRegenCount(): Promise<void> {
  const ym = currentYearMonth()
  const rec = await loadRegenRecord()
  if (!rec || rec.yearMonth !== ym) {
    await saveRegenRecord(1, ym)
  } else {
    await saveRegenRecord(rec.count + 1, ym)
  }
}

// ─── Premium activation ────────────────────────────────────────────────────────
// Called after a successful RevenueCat purchase/restore to sync the premium
// flag into the local profile cache and Supabase.

export async function activatePremium(profileKey: string): Promise<void> {
  const raw = await AsyncStorage.getItem(profileKey)
  if (raw) {
    try {
      const profile = JSON.parse(raw)
      profile.isPremium = true
      await AsyncStorage.setItem(profileKey, JSON.stringify(profile))
    } catch {
      // ignore parse errors on corrupt cache
    }
  }
  const { data } = await supabase.auth.getUser()
  if (data.user?.id) {
    await supabase.from('profiles').update({ is_premium: true }).eq('id', data.user.id).catch(() => null)
  }
}
