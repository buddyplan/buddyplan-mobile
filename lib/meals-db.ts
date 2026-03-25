import { Meal } from '../types'

// Local DB: breakfast only — TheMealDB ไม่มีอาหารเช้าไทย
export const mealsDB: Meal[] = [
  {
    id: 'b01', name: 'ข้าวต้มไข่', type: 'breakfast',
    calories: 320, price: 45, protein: 14, carbs: 52, fat: 6,
    tags: ['no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['ข้าวสวย', 'ไข่ไก่', 'ขิง', 'ต้นหอม', 'ซีอิ๊วขาว'], emoji: '🍚',
  },
  {
    id: 'b02', name: 'โจ๊กหมู', type: 'breakfast',
    calories: 290, price: 50, protein: 16, carbs: 44, fat: 5,
    tags: ['no-beef', 'no-seafood'],
    ingredients: ['ข้าว', 'หมูสับ', 'ขิง', 'ต้นหอม', 'กระเทียมเจียว'], emoji: '🥣',
  },
  {
    id: 'b03', name: 'ข้าวไข่กระทะ', type: 'breakfast',
    calories: 450, price: 55, protein: 18, carbs: 58, fat: 14,
    tags: ['no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['ข้าวสวย', 'ไข่ไก่', 'น้ำมัน', 'ซอสปรุงรส', 'พริกไทย'], emoji: '🍳',
  },
  {
    id: 'b04', name: 'โยเกิร์ตผลไม้', type: 'breakfast',
    calories: 220, price: 65, protein: 10, carbs: 38, fat: 3,
    tags: ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['โยเกิร์ตกรีก', 'กล้วย', 'สตรอว์เบอร์รี่', 'น้ำผึ้ง'], emoji: '🫙',
  },
  {
    id: 'b05', name: 'ขนมปัง + ไข่ดาว', type: 'breakfast',
    calories: 380, price: 40, protein: 15, carbs: 46, fat: 13,
    tags: ['no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['ขนมปัง', 'ไข่ไก่', 'น้ำมัน', 'เนย', 'พริกไทย'], emoji: '🍞',
  },
  {
    id: 'b06', name: 'กล้วย + นม', type: 'breakfast',
    calories: 250, price: 30, protein: 8, carbs: 48, fat: 4,
    tags: ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['กล้วยหอม', 'นมสด', 'น้ำตาล'], emoji: '🍌',
  },
  {
    id: 'b07', name: 'ข้าวต้มปลา', type: 'breakfast',
    calories: 300, price: 55, protein: 18, carbs: 42, fat: 5,
    tags: ['no-pork', 'no-beef'],
    ingredients: ['ข้าวสวย', 'ปลาช่อน', 'ขิง', 'ต้นหอม', 'น้ำปลา'], emoji: '🐟',
  },
  {
    id: 'b08', name: 'ไข่ออมเล็ต', type: 'breakfast',
    calories: 340, price: 45, protein: 16, carbs: 8, fat: 18,
    tags: ['no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['ไข่ไก่', 'หัวหอม', 'มะเขือเทศ', 'น้ำมัน', 'เกลือ'], emoji: '🥚',
  },
  {
    id: 'b09', name: 'โอ้ตมีลกล้วย', type: 'breakfast',
    calories: 280, price: 35, protein: 9, carbs: 50, fat: 5,
    tags: ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['โอ้ตมีล', 'กล้วยหอม', 'นมสด', 'น้ำผึ้ง', 'อบเชย'], emoji: '🌾',
  },
  {
    id: 'b10', name: 'แซนวิชไก่', type: 'breakfast',
    calories: 420, price: 60, protein: 28, carbs: 42, fat: 12,
    tags: ['no-pork', 'no-beef', 'no-seafood'],
    ingredients: ['ขนมปัง', 'ไก่อบ', 'ผักกาด', 'มะเขือเทศ', 'มายองเนส'], emoji: '🥪',
  },
]

export function getMealsByType(type: Meal['type']): Meal[] {
  return mealsDB.filter((m) => m.type === type)
}
