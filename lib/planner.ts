import { Meal, DayPlan, WeekPlan, ShoppingItem, UserProfile } from '../types'
import { mealsDB } from './meals-db'

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function buildShoppingList(days: DayPlan[]): ShoppingItem[] {
  const ingredientMap: Record<string, { count: number; price: number; category: ShoppingItem['category'] }> = {}

  const categoryMap: Record<string, ShoppingItem['category']> = {
    ไก่: 'meat', หมู: 'meat', เป็ด: 'meat', ปลา: 'meat', กุ้ง: 'meat', ปลากะพง: 'meat', ปลาช่อน: 'meat',
    ข้าวสวย: 'other', ข้าวมัน: 'other', ข้าวเหนียว: 'other', เส้นก๋วยเตี๋ยว: 'other', วุ้นเส้น: 'other',
    เส้นเล็ก: 'other', ขนมปัง: 'other', โอ้ตมีล: 'other', โยเกิร์ตกรีก: 'other', นมสด: 'other',
    ไข่ไก่: 'other', เต้าหู้: 'other',
    กะเพรา: 'vegetable', ผักบุ้ง: 'vegetable', ถั่วงอก: 'vegetable', มะเขือเทศ: 'vegetable',
    แตงกวา: 'vegetable', ผักกาด: 'vegetable', บร็อคโคลี่: 'vegetable', แครอท: 'vegetable',
    ฟักทอง: 'vegetable', มันฝรั่ง: 'vegetable', เห็ด: 'vegetable', กล้วยหอม: 'vegetable',
    สตรอว์เบอร์รี่: 'vegetable', ผลไม้: 'vegetable',
    กระเทียม: 'seasoning', พริก: 'seasoning', ขิง: 'seasoning', ตะไคร้: 'seasoning',
    ข่า: 'seasoning', ใบมะกรูด: 'seasoning', น้ำปลา: 'seasoning', ซีอิ๊ว: 'seasoning',
    น้ำมันหอย: 'seasoning', น้ำมัน: 'seasoning', น้ำมันมะกอก: 'seasoning', น้ำตาล: 'seasoning',
    น้ำมะนาว: 'seasoning', มะนาว: 'seasoning', พริกแกงเขียว: 'seasoning', พริกแกงเผ็ด: 'seasoning',
    พริกป่น: 'seasoning', โรสแมรี่: 'seasoning', อบเชย: 'seasoning', น้ำผึ้ง: 'seasoning',
    กะทิ: 'seasoning', ซีอิ๊วขาว: 'seasoning', ซีอิ๊วดำ: 'seasoning', ซอสปรุงรส: 'seasoning',
  }

  const ingredientPrices: Record<string, number> = {
    ไก่: 60, หมู: 55, เป็ด: 70, ปลากะพง: 80, ปลาช่อน: 65, กุ้ง: 90,
    ข้าวสวย: 20, เส้นก๋วยเตี๋ยว: 15, วุ้นเส้น: 20, เส้นเล็ก: 15, ขนมปัง: 25,
    โอ้ตมีล: 35, โยเกิร์ตกรีก: 45, นมสด: 30, ไข่ไก่: 15, เต้าหู้: 20,
    กล้วยหอม: 15, สตรอว์เบอร์รี่: 40, ผักกาด: 15, มะเขือเทศ: 20, แตงกวา: 15,
    บร็อคโคลี่: 25, แครอท: 15, ฟักทอง: 20, มันฝรั่ง: 20, เห็ด: 30,
    กระเทียม: 10, พริก: 10, ขิง: 10, ตะไคร้: 10, ข่า: 10, ใบมะกรูด: 10,
    น้ำปลา: 25, ซีอิ๊ว: 20, น้ำมันหอย: 20, น้ำมัน: 30, กะทิ: 25,
  }

  for (const day of days) {
    const meals = [day.breakfast, day.lunch, day.dinner]
    for (const meal of meals) {
      for (const ing of meal.ingredients) {
        if (!ingredientMap[ing]) {
          ingredientMap[ing] = {
            count: 0,
            price: ingredientPrices[ing] ?? 20,
            category: categoryMap[ing] ?? 'other',
          }
        }
        ingredientMap[ing].count++
      }
    }
  }

  return Object.entries(ingredientMap).map(([name, { count, price, category }]) => ({
    name,
    category,
    quantity: count > 3 ? `${count} ครั้ง` : count === 1 ? '1 ครั้ง' : `${count} ครั้ง`,
    estimatedPrice: price,
    checked: false,
  }))
}

export function generateWeekPlan(profile: UserProfile, extraMeals: Meal[] = []): WeekPlan {
  const { budgetPerWeek, targetCalories, dietTags } = profile
  const allMeals = [...mealsDB, ...extraMeals]

  function getMealsForUserEx(type: Meal['type']): Meal[] {
    const byType = allMeals.filter((m) => m.type === type)
    if (dietTags.length === 0) return byType
    return byType.filter((meal) => dietTags.every((tag) => meal.tags.includes(tag)))
  }

  let breakfasts = shuffle(getMealsForUserEx('breakfast'))
  let lunches = shuffle(getMealsForUserEx('lunch'))
  let dinners = shuffle(getMealsForUserEx('dinner'))

  // Fallback: if filtered pools are empty, use all meals of that type
  if (breakfasts.length === 0) breakfasts = shuffle(allMeals.filter((m) => m.type === 'breakfast'))
  if (lunches.length === 0) lunches = shuffle(allMeals.filter((m) => m.type === 'lunch'))
  if (dinners.length === 0) dinners = shuffle(allMeals.filter((m) => m.type === 'dinner'))

  const today = new Date()
  const days: DayPlan[] = []

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const breakfast = breakfasts[i % breakfasts.length]
    const lunch = lunches[i % lunches.length]
    const dinner = dinners[i % dinners.length]

    days.push({
      date: date.toISOString().split('T')[0],
      breakfast,
      lunch,
      dinner,
      totalCalories: breakfast.calories + lunch.calories + dinner.calories,
      totalPrice: breakfast.price + lunch.price + dinner.price,
    })
  }

  let totalPrice = days.reduce((s, d) => s + d.totalPrice, 0)

  // Budget adjustment: swap expensive meals with cheaper alternatives
  if (totalPrice > budgetPerWeek) {
    for (let i = 0; i < days.length && totalPrice > budgetPerWeek; i++) {
      const day = days[i]
      const cheaperBreakfast = breakfasts.find((m) => m.price < day.breakfast.price)
      if (cheaperBreakfast) {
        totalPrice -= day.breakfast.price - cheaperBreakfast.price
        day.breakfast = cheaperBreakfast
        day.totalPrice = day.breakfast.price + day.lunch.price + day.dinner.price
        day.totalCalories = day.breakfast.calories + day.lunch.calories + day.dinner.calories
      }
    }
  }

  const shoppingList = buildShoppingList(days)
  const avgCaloriesPerDay = Math.round(days.reduce((s, d) => s + d.totalCalories, 0) / 7)

  return {
    generatedAt: new Date().toISOString(),
    days,
    totalPrice: days.reduce((s, d) => s + d.totalPrice, 0),
    avgCaloriesPerDay,
    shoppingList,
  }
}

export function getAlternatives(
  mealType: Meal['type'],
  currentMeal: Meal,
  plan: WeekPlan,
  profile: UserProfile,
  extraMeals: Meal[] = []
): Meal[] {
  const allMeals = [...mealsDB, ...extraMeals]
  const usedIds = new Set(
    plan.days.flatMap((d) => [d.breakfast.id, d.lunch.id, d.dinner.id])
  )
  const byType = allMeals.filter((m: Meal) => m.type === mealType)
  const pool =
    profile.dietTags.length === 0
      ? byType
      : byType.filter((m: Meal) => profile.dietTags.every((tag) => m.tags.includes(tag)))
  const filtered = pool.filter(
    (m: Meal) =>
      m.id !== currentMeal.id &&
      !usedIds.has(m.id) &&
      m.price >= currentMeal.price * 0.7 &&
      m.price <= currentMeal.price * 1.3
  )
  const result =
    filtered.length > 0 ? filtered : pool.filter((m: Meal) => m.id !== currentMeal.id)
  return result.sort(() => Math.random() - 0.5).slice(0, 3)
}

export function swapMeal(
  plan: WeekPlan,
  dayIndex: number,
  mealType: Meal['type'],
  newMeal: Meal
): WeekPlan {
  const updatedDays = plan.days.map((day, i) => {
    if (i !== dayIndex) return day
    const updated = { ...day, [mealType]: newMeal }
    updated.totalCalories =
      updated.breakfast.calories + updated.lunch.calories + updated.dinner.calories
    updated.totalPrice =
      updated.breakfast.price + updated.lunch.price + updated.dinner.price
    return updated
  })
  const totalPrice = updatedDays.reduce((s, d) => s + d.totalPrice, 0)
  const avgCaloriesPerDay = Math.round(
    updatedDays.reduce((s, d) => s + d.totalCalories, 0) / 7
  )
  return {
    ...plan,
    days: updatedDays,
    totalPrice,
    avgCaloriesPerDay,
    shoppingList: buildShoppingList(updatedDays),
  }
}

export const DAY_NAMES_TH = ['จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์', 'อาทิตย์']

export function getDayName(dateStr: string): string {
  const d = new Date(dateStr)
  const jsDay = d.getDay() // 0=Sun, 1=Mon...
  const thaiIdx = jsDay === 0 ? 6 : jsDay - 1
  return DAY_NAMES_TH[thaiIdx]
}
