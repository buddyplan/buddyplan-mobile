import { getCurrentUser } from './auth'
import { supabase } from './supabase'
import { saveRegenRecord, loadRegenRecord } from './db'
import AsyncStorage from '@react-native-async-storage/async-storage'

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

export async function getUserTier(isPremium?: boolean): Promise<Tier> {
  const user = await getCurrentUser()
  if (!user) return 'free'
  if (isPremium) return 'premium'
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

// ─── Premium activation (mock — replace with RevenueCat/Stripe later) ─────────

export async function activatePremium(profileKey: string): Promise<void> {
  const raw = await AsyncStorage.getItem(profileKey)
  if (raw) {
    const profile = JSON.parse(raw)
    profile.isPremium = true
    await AsyncStorage.setItem(profileKey, JSON.stringify(profile))
  }
  const { data } = await supabase.auth.getUser()
  if (data.user?.id) {
    await supabase.from('profiles').update({ is_premium: true }).eq('id', data.user.id)
  }
}
