/**
 * db.ts — API Gateway-backed storage
 * Falls back to AsyncStorage when user is not authenticated (offline / onboarding)
 */
import { supabase } from './supabase'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserProfile, WeekPlan } from '../types'
import { profileApi } from './api-client'

const PROFILE_KEY      = '@buddyplan_profile'
const PLAN_KEY         = '@buddyplan_plan'
const SHOPPING_KEY     = '@buddyplan_shopping'
const FAVORITES_KEY    = '@buddyplan_favorites'
const THEME_KEY        = '@buddyplan_theme'
const NOTIF_KEY        = '@buddyplan_notifications'
const REGEN_KEY        = '@buddyplan_regen'

// ─── helpers ──────────────────────────────────────────────────────────────────

async function getUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

// ─── Profile ──────────────────────────────────────────────────────────────────

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile))

  const userId = await getUserId()
  if (!userId) return

  await profileApi.update(userId, {
    goal: profile.goal,
    budget_per_week: profile.budgetPerWeek,
    target_calories: profile.targetCalories,
    diet_tags: profile.dietTags,
    name: profile.name ?? null,
    created_at: profile.createdAt,
    is_premium: profile.isPremium ?? false,
  }).catch(() => null)
}

export async function loadProfile(): Promise<UserProfile | null> {
  const userId = await getUserId()

  if (userId) {
    try {
      const data = await profileApi.get(userId) as any
      const profile: UserProfile = {
        goal: data.goal,
        budgetPerWeek: data.budget_per_week,
        targetCalories: data.target_calories,
        dietTags: data.diet_tags ?? [],
        name: data.name ?? undefined,
        createdAt: data.created_at,
        isPremium: data.is_premium ?? false,
      }
      await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
      return profile
    } catch {
      // fallthrough to local
    }
  }

  const raw = await AsyncStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

// ─── Week Plan ────────────────────────────────────────────────────────────────

export async function savePlan(plan: WeekPlan): Promise<void> {
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan))

  const userId = await getUserId()
  if (!userId) return

  // Save plan via profile-service (stored in user_preferences as latest_plan)
  await profileApi.updatePreferences(userId, {
    latest_plan: plan,
    plan_generated_at: plan.generatedAt,
  }).catch(() => null)
}

export async function loadPlan(): Promise<WeekPlan | null> {
  const userId = await getUserId()

  if (userId) {
    try {
      const prefs = await profileApi.getPreferences(userId) as any
      if (prefs?.latest_plan) {
        const plan = prefs.latest_plan as WeekPlan
        await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan))
        return plan
      }
    } catch {
      // fallthrough to local
    }
  }

  const raw = await AsyncStorage.getItem(PLAN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WeekPlan
  } catch {
    return null
  }
}

// ─── Shopping Checked ─────────────────────────────────────────────────────────

export async function saveShoppingChecked(checked: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(checked))

  const userId = await getUserId()
  if (!userId) return

  await profileApi.updatePreferences(userId, {
    shopping_checked: checked,
    shopping_updated_at: new Date().toISOString(),
  }).catch(() => null)
}

export async function loadShoppingChecked(): Promise<Record<string, boolean>> {
  const userId = await getUserId()

  if (userId) {
    try {
      const prefs = await profileApi.getPreferences(userId) as any
      if (prefs?.shopping_checked) {
        return prefs.shopping_checked as Record<string, boolean>
      }
    } catch {
      // fallthrough to local
    }
  }

  const raw = await AsyncStorage.getItem(SHOPPING_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

// ─── User Preferences (favorites, theme, notifications, regen) ────────────────
// Single Supabase table: user_preferences

async function upsertUserPref(fields: Record<string, unknown>): Promise<void> {
  const userId = await getUserId()
  if (!userId) return
  await profileApi.updatePreferences(userId, {
    updated_at: new Date().toISOString(),
    ...fields,
  }).catch(() => null)
}

async function loadUserPrefs(): Promise<Record<string, unknown> | null> {
  const userId = await getUserId()
  if (!userId) return null
  try {
    const data = await profileApi.getPreferences(userId)
    return data as Record<string, unknown>
  } catch {
    return null
  }
}

// ─── Favorites ────────────────────────────────────────────────────────────────

export async function saveFavorites(mealIds: string[]): Promise<void> {
  await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(mealIds))
  await upsertUserPref({ favorites: mealIds })
}

export async function loadFavorites(): Promise<string[]> {
  const remote = await loadUserPrefs()
  if (remote?.favorites) {
    const ids = remote.favorites as string[]
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids))
    return ids
  }
  const raw = await AsyncStorage.getItem(FAVORITES_KEY)
  if (!raw) return []
  try { return JSON.parse(raw) as string[] } catch { return [] }
}

// ─── Theme ────────────────────────────────────────────────────────────────────

export async function saveTheme(theme: 'dark' | 'light'): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, theme)
  await upsertUserPref({ theme })
}

export async function loadTheme(): Promise<'dark' | 'light' | null> {
  const remote = await loadUserPrefs()
  if (remote?.theme) {
    const t = remote.theme as 'dark' | 'light'
    await AsyncStorage.setItem(THEME_KEY, t)
    return t
  }
  const raw = await AsyncStorage.getItem(THEME_KEY)
  return (raw as 'dark' | 'light' | null)
}

// ─── Notification Preferences ─────────────────────────────────────────────────

export async function saveNotifPrefsDB(prefs: object): Promise<void> {
  await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(prefs))
  await upsertUserPref({ notification_prefs: prefs })
}

export async function loadNotifPrefsDB(): Promise<object | null> {
  const remote = await loadUserPrefs()
  if (remote?.notification_prefs) {
    const p = remote.notification_prefs as object
    await AsyncStorage.setItem(NOTIF_KEY, JSON.stringify(p))
    return p
  }
  const raw = await AsyncStorage.getItem(NOTIF_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// ─── Regen Counter ────────────────────────────────────────────────────────────

export async function saveRegenRecord(count: number, yearMonth: string): Promise<void> {
  await AsyncStorage.setItem(REGEN_KEY, JSON.stringify({ count, yearMonth }))
  await upsertUserPref({ regen_count: count, regen_year_month: yearMonth })
}

export async function loadRegenRecord(): Promise<{ count: number; yearMonth: string } | null> {
  const remote = await loadUserPrefs()
  if (remote?.regen_year_month) {
    const rec = { count: remote.regen_count as number, yearMonth: remote.regen_year_month as string }
    await AsyncStorage.setItem(REGEN_KEY, JSON.stringify(rec))
    return rec
  }
  const raw = await AsyncStorage.getItem(REGEN_KEY)
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

// ─── Clear All ────────────────────────────────────────────────────────────────

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    PROFILE_KEY, PLAN_KEY, SHOPPING_KEY, FAVORITES_KEY,
    THEME_KEY, NOTIF_KEY, REGEN_KEY,
  ])
}
