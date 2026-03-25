import AsyncStorage from '@react-native-async-storage/async-storage'
import { UserProfile, WeekPlan } from '../types'

const PROFILE_KEY = '@buddyplan_profile'
const PLAN_KEY = '@buddyplan_plan'
const SHOPPING_KEY = '@buddyplan_shopping'

export async function saveProfile(profile: UserProfile): Promise<void> {
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

export async function loadProfile(): Promise<UserProfile | null> {
  const raw = await AsyncStorage.getItem(PROFILE_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as UserProfile
  } catch {
    return null
  }
}

export async function savePlan(plan: WeekPlan): Promise<void> {
  await AsyncStorage.setItem(PLAN_KEY, JSON.stringify(plan))
}

export async function loadPlan(): Promise<WeekPlan | null> {
  const raw = await AsyncStorage.getItem(PLAN_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw) as WeekPlan
  } catch {
    return null
  }
}

export async function saveShoppingChecked(checked: Record<string, boolean>): Promise<void> {
  await AsyncStorage.setItem(SHOPPING_KEY, JSON.stringify(checked))
}

export async function loadShoppingChecked(): Promise<Record<string, boolean>> {
  const raw = await AsyncStorage.getItem(SHOPPING_KEY)
  if (!raw) return {}
  try {
    return JSON.parse(raw) as Record<string, boolean>
  } catch {
    return {}
  }
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([PROFILE_KEY, PLAN_KEY, SHOPPING_KEY])
}
