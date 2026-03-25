export type Goal = 'lose' | 'maintain' | 'gain'
export type DietTag = 'vegetarian' | 'no-pork' | 'no-beef' | 'no-seafood' | 'no-gluten'
export type MealType = 'breakfast' | 'lunch' | 'dinner'

export interface UserProfile {
  name?: string
  goal: Goal
  budgetPerWeek: number
  targetCalories: number
  dietTags: DietTag[]
  createdAt: string
  isPremium?: boolean
}

export interface Meal {
  id: string
  name: string
  type: MealType
  calories: number
  price: number
  protein: number
  carbs: number
  fat: number
  tags: DietTag[]
  ingredients: string[]
  emoji: string
  imageUrl?: string
}

export interface DayPlan {
  date: string
  breakfast: Meal
  lunch: Meal
  dinner: Meal
  totalCalories: number
  totalPrice: number
}

export interface WeekPlan {
  generatedAt: string
  days: DayPlan[]
  totalPrice: number
  avgCaloriesPerDay: number
  shoppingList: ShoppingItem[]
}

export interface ShoppingItem {
  name: string
  category: 'meat' | 'vegetable' | 'seasoning' | 'other'
  quantity: string
  estimatedPrice: number
  checked: boolean
}
