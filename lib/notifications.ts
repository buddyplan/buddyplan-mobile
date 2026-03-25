import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'
import { saveNotifPrefsDB, loadNotifPrefsDB } from './db'

export interface NotificationPrefs {
  enabled: boolean
  breakfast: boolean
  breakfastHour: number
  breakfastMinute: number
  lunch: boolean
  lunchHour: number
  lunchMinute: number
  dinner: boolean
  dinnerHour: number
  dinnerMinute: number
  shopping: boolean   // Sunday 10:00 reminder
}

export const DEFAULT_PREFS: NotificationPrefs = {
  enabled: false,
  breakfast: true,
  breakfastHour: 7,
  breakfastMinute: 0,
  lunch: true,
  lunchHour: 12,
  lunchMinute: 0,
  dinner: true,
  dinnerHour: 18,
  dinnerMinute: 0,
  shopping: true,
}

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

export async function requestPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('buddyplan', {
      name: 'BuddyPlan Reminders',
      importance: Notifications.AndroidImportance.DEFAULT,
    })
  }
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

export async function loadNotifPrefs(): Promise<NotificationPrefs> {
  const remote = await loadNotifPrefsDB()
  if (remote) return { ...DEFAULT_PREFS, ...(remote as Partial<NotificationPrefs>) }
  return DEFAULT_PREFS
}

export async function saveNotifPrefs(prefs: NotificationPrefs): Promise<void> {
  await saveNotifPrefsDB(prefs)
}

export async function scheduleAll(prefs: NotificationPrefs): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync()
  if (!prefs.enabled) return

  const MEAL_TEXTS: Record<string, { title: string; body: string }> = {
    breakfast: { title: '🌅 ถึงเวลาอาหารเช้าแล้ว!', body: 'Buddy เตรียมเมนูไว้ให้แล้ว ไปดูกันเลย 🍳' },
    lunch:     { title: '☀️ ถึงเวลาอาหารกลางวัน!', body: 'อย่าลืมทานมื้อเที่ยงตามแผนนะ 🍱' },
    dinner:    { title: '🌙 ถึงเวลาอาหารเย็นแล้ว!', body: 'สิ้นสุดวันด้วยมื้อดีๆ ตามที่วางแผนไว้ 🍲' },
  }

  const meals: { key: keyof typeof MEAL_TEXTS; enabled: boolean; hour: number; minute: number }[] = [
    { key: 'breakfast', enabled: prefs.breakfast, hour: prefs.breakfastHour, minute: prefs.breakfastMinute },
    { key: 'lunch',     enabled: prefs.lunch,     hour: prefs.lunchHour,     minute: prefs.lunchMinute     },
    { key: 'dinner',    enabled: prefs.dinner,    hour: prefs.dinnerHour,    minute: prefs.dinnerMinute    },
  ]

  for (const meal of meals) {
    if (!meal.enabled) continue
    await Notifications.scheduleNotificationAsync({
      content: {
        title: MEAL_TEXTS[meal.key].title,
        body: MEAL_TEXTS[meal.key].body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: meal.hour,
        minute: meal.minute,
      },
    })
  }

  if (prefs.shopping) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🛒 อย่าลืมซื้อของสัปดาห์นี้!',
        body: 'เปิด Shopping list ดูของที่ต้องซื้อสำหรับแผนอาหารสัปดาห์นี้',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
      },
    })
  }
}
