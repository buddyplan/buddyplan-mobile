import { useState, useEffect, useCallback } from 'react'
import { getUserTier, getRemainingRegens, TIER_LIMITS, Tier } from '../lib/subscription'

export interface SubscriptionState {
  tier: Tier
  remainingRegens: number
  canRegen: boolean
  canFavorite: boolean
  canSwap: boolean
  isPremium: boolean
  loading: boolean
  refresh: () => void
}

export function useSubscription(isPremium?: boolean): SubscriptionState {
  const [tier, setTier] = useState<Tier>('free')
  const [remainingRegens, setRemainingRegens] = useState(TIER_LIMITS.free.regensPerMonth)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    const [t, r] = await Promise.all([getUserTier(isPremium), getRemainingRegens()])
    setTier(t)
    setRemainingRegens(r)
    setLoading(false)
  }, [isPremium])

  useEffect(() => { load() }, [load])

  const canRegen    = tier !== 'free' || remainingRegens > 0
  const canFavorite = tier !== 'free'
  const canSwap     = tier !== 'free'

  return { tier, remainingRegens, canRegen, canFavorite, canSwap, isPremium: tier === 'premium', loading, refresh: load }
}
