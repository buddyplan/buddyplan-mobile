/**
 * Tests: lib/subscription.ts
 */

// Mock React Native modules ก่อน import อื่นๆ
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
    from: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({ error: null }),
  },
}))

jest.mock('../../lib/auth', () => ({
  getCurrentUser: jest.fn(),
}))

jest.mock('../../lib/revenuecat', () => ({
  isPremiumActive: jest.fn().mockResolvedValue(false),
}))

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
)

// Mock db.ts ให้ใช้ in-memory store แทน AsyncStorage จริง
const regenStore: { count: number; yearMonth: string } | null = null
jest.mock('../../lib/db', () => {
  let store: { count: number; yearMonth: string } | null = null
  return {
    loadRegenRecord: jest.fn(async () => store),
    saveRegenRecord: jest.fn(async (count: number, yearMonth: string) => {
      store = { count, yearMonth }
    }),
  }
})

import { getUserTier, getRemainingRegens, incrementRegenCount, TIER_LIMITS } from '../../lib/subscription'

const mockGetCurrentUser = require('../../lib/auth').getCurrentUser as jest.Mock
const mockIsPremiumActive = require('../../lib/revenuecat').isPremiumActive as jest.Mock
const { loadRegenRecord, saveRegenRecord } = require('../../lib/db')

describe('getUserTier', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockIsPremiumActive.mockResolvedValue(false)
  })

  it('returns "free" when no user is logged in', async () => {
    mockGetCurrentUser.mockResolvedValue(null)
    expect(await getUserTier()).toBe('free')
  })

  it('returns "registered" for logged-in user without premium', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    expect(await getUserTier(false)).toBe('registered')
  })

  it('returns "premium" when isPremium flag is true', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    expect(await getUserTier(true)).toBe('premium')
  })

  it('returns "premium" when RevenueCat entitlement is active', async () => {
    mockGetCurrentUser.mockResolvedValue({ id: 'user-1' })
    mockIsPremiumActive.mockResolvedValue(true)
    expect(await getUserTier(false)).toBe('premium')
  })
})

describe('Regen counter', () => {
  const CURRENT_YM = (() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })()

  beforeEach(() => {
    loadRegenRecord.mockResolvedValue(null)
    saveRegenRecord.mockClear()
  })

  it('returns full regens when no record exists', async () => {
    loadRegenRecord.mockResolvedValue(null)
    const remaining = await getRemainingRegens()
    expect(remaining).toBe(TIER_LIMITS.free.regensPerMonth)
  })

  it('returns 0 when limit is reached for current month', async () => {
    loadRegenRecord.mockResolvedValue({ count: TIER_LIMITS.free.regensPerMonth, yearMonth: CURRENT_YM })
    const remaining = await getRemainingRegens()
    expect(remaining).toBe(0)
  })

  it('resets count when yearMonth is different', async () => {
    loadRegenRecord.mockResolvedValue({ count: 99, yearMonth: '2020-01' })
    const remaining = await getRemainingRegens()
    expect(remaining).toBe(TIER_LIMITS.free.regensPerMonth)
  })

  it('calls saveRegenRecord with incremented count', async () => {
    loadRegenRecord.mockResolvedValue({ count: 1, yearMonth: CURRENT_YM })
    await incrementRegenCount()
    expect(saveRegenRecord).toHaveBeenCalledWith(2, CURRENT_YM)
  })
})
