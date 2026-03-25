/**
 * Tests: lib/planner.ts
 */
import { generateWeekPlan, getDayName, DAY_NAMES_TH } from '../../lib/planner'
import { UserProfile } from '../../types'

// Mock native modules ที่รันใน Node ไม่ได้
jest.mock('../../lib/supabase', () => ({ supabase: {} }))
jest.mock('react-native', () => ({ Platform: { OS: 'ios' } }))

const mockProfile: UserProfile = {
  goal: 'maintain',
  budgetPerWeek: 1400,
  targetCalories: 1800,
  dietTags: [],
  createdAt: new Date().toISOString(),
}

// lunch/dinner ต้องส่งเป็น extraMeals เพราะ mealsDB มีแค่ breakfast
const mockExtraMeals = [
  { id: 'l1', name: 'ข้าวผัดไก่', type: 'lunch' as const, calories: 500, price: 60, protein: 25, carbs: 60, fat: 12, tags: ['no-beef', 'no-seafood'], ingredients: ['ไก่', 'ข้าว'], emoji: '🍳' },
  { id: 'l2', name: 'ผัดกระเพราหมู', type: 'lunch' as const, calories: 480, price: 55, protein: 22, carbs: 55, fat: 14, tags: ['no-beef', 'no-seafood'], ingredients: ['หมู', 'กระเพรา'], emoji: '🌿' },
  { id: 'l3', name: 'ข้าวมันไก่', type: 'lunch' as const, calories: 520, price: 65, protein: 28, carbs: 58, fat: 15, tags: ['no-pork', 'no-beef', 'no-seafood'], ingredients: ['ไก่', 'ข้าวมัน'], emoji: '🍗' },
  { id: 'd1', name: 'ต้มยำกุ้ง', type: 'dinner' as const, calories: 300, price: 90, protein: 20, carbs: 25, fat: 8, tags: ['no-pork', 'no-beef'], ingredients: ['กุ้ง', 'ตะไคร้'], emoji: '🍲' },
  { id: 'd2', name: 'แกงเขียวหวานไก่', type: 'dinner' as const, calories: 450, price: 80, protein: 24, carbs: 40, fat: 18, tags: ['no-pork', 'no-beef', 'no-seafood'], ingredients: ['ไก่', 'กะทิ'], emoji: '🥘' },
  { id: 'd3', name: 'ผัดผักรวม', type: 'dinner' as const, calories: 250, price: 50, protein: 8, carbs: 30, fat: 10, tags: ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'], ingredients: ['ผัก'], emoji: '🥦' },
]

describe('getDayName', () => {
  it('returns จันทร์ for a Monday date', () => {
    // 2025-01-06 is a Monday
    expect(getDayName('2025-01-06')).toBe('จันทร์')
  })

  it('returns อาทิตย์ for a Sunday date', () => {
    // 2025-01-05 is a Sunday
    expect(getDayName('2025-01-05')).toBe('อาทิตย์')
  })

  it('returns one of the 7 valid Thai day names', () => {
    const result = getDayName(new Date().toISOString())
    expect(DAY_NAMES_TH).toContain(result)
  })
})

describe('generateWeekPlan', () => {
  // ไม่ส่ง extraMeals — planner ใช้ mealsDB ภายในเอง
  it('generates a plan with 7 days', () => {
    const plan = generateWeekPlan(mockProfile, mockExtraMeals)
    expect(plan.days).toHaveLength(7)
  })

  it('each day has breakfast, lunch, and dinner', () => {
    const plan = generateWeekPlan(mockProfile, mockExtraMeals)
    for (const day of plan.days) {
      expect(day.breakfast).toBeDefined()
      expect(day.lunch).toBeDefined()
      expect(day.dinner).toBeDefined()
    }
  })

  it('total weekly cost does not exceed budget by more than 20%', () => {
    const plan = generateWeekPlan(mockProfile, mockExtraMeals)
    const totalCost = plan.days.reduce(
      (sum, d) => sum + d.breakfast.price + d.lunch.price + d.dinner.price,
      0
    )
    expect(totalCost).toBeLessThanOrEqual(mockProfile.budgetPerWeek * 1.2)
  })

  it('sets generatedAt as valid ISO timestamp', () => {
    const plan = generateWeekPlan(mockProfile, mockExtraMeals)
    expect(plan.generatedAt).toBeTruthy()
    expect(new Date(plan.generatedAt).getTime()).not.toBeNaN()
  })

  it('includes totalPrice and avgCaloriesPerDay', () => {
    const plan = generateWeekPlan(mockProfile, mockExtraMeals)
    expect(typeof plan.totalPrice).toBe('number')
    expect(typeof plan.avgCaloriesPerDay).toBe('number')
    expect(plan.totalPrice).toBeGreaterThan(0)
  })
})
