/**
 * TheMealDB integration — free, no API key required
 * Fetches Thai meals, translates names/ingredients to Thai,
 * and caches results in AsyncStorage for 24 hours.
 */

import AsyncStorage from '@react-native-async-storage/async-storage'
import { Meal, DietTag, MealType } from '../types'

const BASE = 'https://www.themealdb.com/api/json/v1/1'
const CACHE_KEY = 'mealdb_thai_v3'
const CACHE_TTL_MS = 24 * 60 * 60 * 1000

interface MealDbListItem {
  idMeal: string
  strMeal: string
  strMealThumb: string
}

interface MealDbDetail {
  idMeal: string
  strMeal: string
  strCategory: string
  strMealThumb?: string
  [key: string]: string | null | undefined
}

// ─── Nutrition / tag / emoji estimates by category ────────────────────────────

const NUTRITION: Record<string, { calories: number; protein: number; carbs: number; fat: number; price: number }> = {
  Beef:          { calories: 580, protein: 32, carbs: 52, fat: 22, price: 90 },
  Chicken:       { calories: 520, protein: 34, carbs: 50, fat: 16, price: 75 },
  Lamb:          { calories: 600, protein: 30, carbs: 48, fat: 26, price: 100 },
  Pork:          { calories: 560, protein: 28, carbs: 54, fat: 20, price: 70 },
  Seafood:       { calories: 460, protein: 30, carbs: 44, fat: 14, price: 95 },
  Vegetarian:    { calories: 360, protein: 14, carbs: 54, fat: 10, price: 60 },
  Vegan:         { calories: 340, protein: 12, carbs: 56, fat:  8, price: 55 },
  Miscellaneous: { calories: 500, protein: 24, carbs: 52, fat: 16, price: 75 },
}

const TAGS: Record<string, DietTag[]> = {
  Beef:          ['no-pork', 'no-seafood'],
  Chicken:       ['no-pork', 'no-beef', 'no-seafood'],
  Lamb:          ['no-pork', 'no-beef', 'no-seafood'],
  Pork:          ['no-beef', 'no-seafood'],
  Seafood:       ['no-pork', 'no-beef'],
  Vegetarian:    ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'],
  Vegan:         ['vegetarian', 'no-pork', 'no-beef', 'no-seafood'],
  Miscellaneous: [],
}

const EMOJI: Record<string, string> = {
  Beef:          '🥩',
  Chicken:       '🍗',
  Lamb:          '🍖',
  Pork:          '🍖',
  Seafood:       '🦐',
  Vegetarian:    '🥗',
  Vegan:         '🥗',
  Miscellaneous: '🍛',
}

// ─── Meal name translations ────────────────────────────────────────────────────

const MEAL_NAME_TH: Record<string, string> = {
  // ── รายการจริงจาก TheMealDB Thai category ──────────────────────────────────
  'Drunken noodles (pad kee mao)':              'ผัดขี้เมา',
  'Lemongrass beef stew with noodles':          'สตูเนื้อตะไคร้ราดเส้น',
  'Massaman Beef curry':                        'แกงมัสมั่นเนื้อ',
  'Pad See Ew':                                 'ผัดซีอิ๊ว',
  'Pad Thai':                                   'ผัดไทย',
  'Panang chicken curry (kaeng panang gai)':    'แกงพะแนงไก่',
  'Prawn stir-fry':                             'กุ้งผัดน้ำมันหอย',
  'Red curry chicken kebabs':                   'ไก่เสียบไม้แกงแดง',
  'Spicy Thai prawn noodles':                   'เส้นกุ้งเผ็ดไทย',
  'Stir-fried chicken with chillies & basil':   'ผัดกะเพราไก่',
  'Thai beef stir-fry':                         'เนื้อผัดพริกไทย',
  'Thai chicken cakes with sweet chilli sauce': 'ทอดมันไก่ซอสพริกหวาน',
  'Thai coconut & veg broth':                   'แกงมะพร้าวผัก',
  'Thai curry noodle soup':                     'ข้าวซอย',
  'Thai drumsticks':                            'น่องไก่ทอดไทย',
  'Thai fried rice with prawns & peas':         'ข้าวผัดกุ้งถั่วลันเตา',
  'Thai green chicken soup':                    'ซุปไก่แกงเขียว',
  'Thai Green Curry':                           'แกงเขียวหวาน',
  'Thai pork & peanut curry':                   'แกงหมูถั่วลิสง',
  'Thai prawn curry':                           'แกงกุ้งไทย',
  'Thai pumpkin soup':                          'ซุปฟักทองไทย',
  'Thai rice noodle salad':                     'ยำเส้นข้าว',
  'Thai-style fish broth with greens':          'ต้มปลาผักใบเขียว',
  'Thai-style steamed fish':                    'ปลานึ่งสไตล์ไทย',
  'Tom kha gai':                                'ต้มข่าไก่',
  'Tom yum (hot & sour) soup with prawns':      'ต้มยำกุ้ง',
  'Tom yum soup with prawns':                   'ต้มยำกุ้ง',
  // ── เมนูอื่นที่อาจมีในอนาคต ───────────────────────────────────────────────
  'Massaman Beef':              'แกงมัสมั่นเนื้อ',
  'Beef Massaman Curry':        'แกงมัสมั่นเนื้อ',
  'Chicken Massaman Curry':     'แกงมัสมั่นไก่',
  'Green Thai Curry':           'แกงเขียวหวาน',
  'Thai Red Curry':             'แกงแดง',
  'Panang Pork':                'แกงพะแนงหมู',
  'Panang Beef':                'แกงพะแนงเนื้อ',
  'Thai Yellow Curry':          'แกงกะหรี่ไทย',
  'Pad Kra Pao':                'ผัดกะเพรา',
  'Thai Basil Chicken':         'ผัดกะเพราไก่',
  'Thai Basil Pork':            'ผัดกะเพราหมู',
  'Khao Pad':                   'ข้าวผัด',
  'Thai Fried Rice':            'ข้าวผัดไทย',
  'Pineapple Fried Rice':       'ข้าวผัดสับปะรด',
  'Cashew Chicken':             'ไก่ผัดเม็ดมะม่วง',
  'Tom Yum Goong':              'ต้มยำกุ้ง',
  'Tom Yam Goong':              'ต้มยำกุ้ง',
  'Tom Kha Gai':                'ต้มข่าไก่',
  'Tom Kha Kai':                'ต้มข่าไก่',
  'Som Tum':                    'ส้มตำ',
  'Som Tam':                    'ส้มตำ',
  'Larb Moo':                   'ลาบหมู',
  'Larb Gai':                   'ลาบไก่',
  'Drunken Noodles':            'ผัดขี้เมา',
  'Pad Kee Mao':                'ผัดขี้เมา',
  'Mango Sticky Rice':          'ข้าวเหนียวมะม่วง',
  'Hor Mok Thalay':             'ห่อหมกทะเล',
  'Kao Pad':                    'ข้าวผัด',
  'Gai Tod':                    'ไก่ทอด',
  'Nua Pad Prik':               'เนื้อผัดพริก',
  'Beef Rendang':               'เนื้อเรนดัง',
  'Khanom Buang':               'ขนมเบื้อง',
  'Satay':                      'สะเต๊ะ',
  'Chicken Satay':              'ไก่สะเต๊ะ',
  'Nasi Goreng':                'ข้าวผัดนาซีโกเร็ง',
}

// ─── Ingredient translations ───────────────────────────────────────────────────

const ING_TH: Record<string, string> = {
  // Protein
  'Chicken':             'ไก่',
  'Chicken Breast':    'อกไก่',
  'Chicken Thigh':     'สะโพกไก่',
  'Chicken Thighs':    'สะโพกไก่',
  'Chicken Wings':     'ปีกไก่',
  'Ground Chicken':    'ไก่สับ',
  'Beef':                'เนื้อวัว',
  'Ground Beef':       'เนื้อวัวสับ',
  'Beef Steak':        'สเต็กเนื้อ',
  'Pork':                'หมู',
  'Pork Belly':        'สามชั้น',
  'Ground Pork':       'หมูสับ',
  'Pork Mince':        'หมูสับ',
  'Pork Tenderloin':   'เนื้อหมูสันใน',
  'Bacon':             'เบคอน',
  'Lamb':                'เนื้อแกะ',
  'Duck':                'เป็ด',
  'Turkey':              'ไก่งวง',
  'Shrimp':              'กุ้ง',
  'Prawns':              'กุ้ง',
  'Tiger Prawns':      'กุ้งกุลาดำ',
  'Fish':                'ปลา',
  'Salmon':              'ปลาแซลมอน',
  'Tuna':                'ปลาทูน่า',
  'Cod':                 'ปลาค็อด',
  'Tilapia':             'ปลานิล',
  'Squid':               'ปลาหมึก',
  'Crab':                'ปู',
  'Clams':               'หอย',
  'Mussels':             'หอยแมลงภู่',
  'Tofu':                'เต้าหู้',
  'Firm Tofu':         'เต้าหู้แข็ง',
  'Eggs':                'ไข่ไก่',
  'Egg':                 'ไข่ไก่',
  // Starches
  'Rice':                'ข้าวสวย',
  'Jasmine Rice':      'ข้าวหอมมะลิ',
  'Sticky Rice':       'ข้าวเหนียว',
  'Brown Rice':        'ข้าวกล้อง',
  'Rice Noodles':      'เส้นก๋วยเตี๋ยว',
  'Flat Rice Noodles': 'เส้นใหญ่',
  'Glass Noodles':     'วุ้นเส้น',
  'Vermicelli':        'เส้นหมี่',
  'Noodles':             'เส้น',
  'Pasta':               'พาสต้า',
  'Bread':               'ขนมปัง',
  'Flour':               'แป้ง',
  'Rice Flour':        'แป้งข้าว',
  'Cornstarch':          'แป้งข้าวโพด',
  // Vegetables
  'Garlic':              'กระเทียม',
  'Onion':               'หัวหอม',
  'Red Onion':         'หัวหอมแดง',
  'White Onion':       'หัวหอมขาว',
  'Shallots':            'หอมแดง',
  'Shallot':             'หอมแดง',
  'Spring Onion':      'ต้นหอม',
  'Green Onion':       'ต้นหอม',
  'Spring Onions':     'ต้นหอม',
  'Ginger':              'ขิง',
  'Lemongrass':          'ตะไคร้',
  'Galangal':            'ข่า',
  'Turmeric':            'ขมิ้น',
  'Coriander':           'ผักชี',
  'Cilantro':            'ผักชี',
  'Basil':               'ใบโหระพา',
  'Thai Basil':        'ใบกะเพรา',
  'Holy Basil':        'ใบกะเพรา',
  'Kaffir Lime Leaves':'ใบมะกรูด',
  'Lime Leaves':       'ใบมะกรูด',
  'Mint':                'สะระแหน่',
  'Tomato':              'มะเขือเทศ',
  'Tomatoes':            'มะเขือเทศ',
  'Cherry Tomatoes':   'มะเขือเทศเชอรี่',
  'Carrot':              'แครอท',
  'Carrots':             'แครอท',
  'Broccoli':            'บร็อคโคลี่',
  'Spinach':             'ผักโขม',
  'Cabbage':             'กะหล่ำปลี',
  'Eggplant':            'มะเขือ',
  'Thai Eggplant':     'มะเขือเปราะ',
  'Zucchini':            'บวบ',
  'Bell Pepper':       'พริกหวาน',
  'Bell Peppers':      'พริกหวาน',
  'Cucumber':            'แตงกวา',
  'Beans':               'ถั่ว',
  'Bean Sprouts':      'ถั่วงอก',
  'Green Beans':       'ถั่วฝักยาว',
  'Long Beans':        'ถั่วฝักยาว',
  'Bamboo Shoots':     'หน่อไม้',
  'Mushrooms':           'เห็ด',
  'Oyster Mushrooms':  'เห็ดนางฟ้า',
  'Shiitake Mushrooms':'เห็ดหอม',
  'Straw Mushrooms':   'เห็ดฟาง',
  'Potato':              'มันฝรั่ง',
  'Potatoes':            'มันฝรั่ง',
  'Sweet Potato':      'มันเทศ',
  'Pumpkin':             'ฟักทอง',
  'Corn':                'ข้าวโพด',
  'Lettuce':             'ผักกาด',
  'Bok Choy':          'ผักกวางตุ้ง',
  'Pak':                 'ผัก',
  // Fruit
  'Lime':                'มะนาว',
  'Lemon':               'มะนาว',
  'Mango':               'มะม่วง',
  'Pineapple':           'สับปะรด',
  'Banana':              'กล้วย',
  'Papaya':              'มะละกอ',
  'Coconut':             'มะพร้าว',
  // Sauces / seasonings
  'Fish Sauce':        'น้ำปลา',
  'Soy Sauce':         'ซีอิ๊วขาว',
  'Light Soy Sauce':   'ซีอิ๊วขาว',
  'Dark Soy Sauce':    'ซีอิ๊วดำ',
  'Oyster Sauce':      'น้ำมันหอย',
  'Coconut Milk':      'กะทิ',
  'Coconut Cream':     'หัวกะทิ',
  'Shrimp Paste':      'กะปิ',
  'Tamarind':          'มะขาม',
  'Tamarind Paste':    'น้ำมะขาม',
  'Tamarind Juice':    'น้ำมะขาม',
  'Palm Sugar':        'น้ำตาลปี๊บ',
  'Brown Sugar':       'น้ำตาลทราย',
  'Sugar':               'น้ำตาล',
  'Salt':                'เกลือ',
  'Pepper':              'พริกไทย',
  'Black Pepper':      'พริกไทยดำ',
  'White Pepper':      'พริกไทยขาว',
  'Chilli':              'พริก',
  'Chili':               'พริก',
  'Chilies':             'พริก',
  'Chillies':            'พริก',
  'Red Chilli':        'พริกแดง',
  'Green Chilli':      'พริกเขียว',
  'Dried Chilli':      'พริกแห้ง',
  'Chilli Flakes':     'พริกป่น',
  'Curry Paste':       'เครื่องแกง',
  'Green Curry Paste': 'พริกแกงเขียว',
  'Red Curry Paste':   'พริกแกงแดง',
  'Massaman Paste':    'เครื่องแกงมัสมั่น',
  'Panang Paste':      'เครื่องแกงพะแนง',
  'Yellow Curry Paste':'เครื่องแกงกะหรี่',
  'Peanuts':             'ถั่วลิสง',
  'Cashews':             'มะม่วงหิมพานต์',
  'Sesame':              'งา',
  'Sesame Oil':        'น้ำมันงา',
  'Vegetable Oil':     'น้ำมันพืช',
  'Oil':                 'น้ำมัน',
  'Olive Oil':         'น้ำมันมะกอก',
  'Butter':              'เนย',
  'Milk':                'นมสด',
  'Cream':               'ครีม',
  'Honey':               'น้ำผึ้ง',
  'Vinegar':             'น้ำส้มสายชู',
  'Lime Juice':        'น้ำมะนาว',
  'Lemon Juice':       'น้ำมะนาว',
  'Chicken Stock':     'น้ำซุปไก่',
  'Beef Stock':        'น้ำซุปเนื้อ',
  'Vegetable Stock':   'น้ำซุปผัก',
  'Chicken Broth':     'น้ำซุปไก่',
  'Water':               'น้ำเปล่า',
  // Spices
  'Cinnamon':            'อบเชย',
  'Star Anise':        'โป๊ยกั๊ก',
  'Cardamom':            'กระวาน',
  'Cloves':              'กานพลู',
  'Cumin':               'ยี่หร่า',
  'Cumin Seeds':       'เมล็ดยี่หร่า',
  'Nutmeg':              'ลูกจันทน์เทศ',
  'Paprika':             'พริกหวานป่น',
  'Turmeric':            'ขมิ้น',
  'Bay Leaves':        'ใบกระวาน',
  'Thyme':               'ไทม์',
  'Rosemary':            'โรสแมรี่',
  'Parsley':             'พาร์สลีย์',
  'Dill':                'ผักชีลาว',
  // Misc
  'Dried Shrimp':      'กุ้งแห้ง',
  'Lime Zest':         'ผิวมะนาว',
  'Lemongrass':          'ตะไคร้',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function translateName(eng: string): string {
  if (MEAL_NAME_TH[eng]) return MEAL_NAME_TH[eng]
  // Case-insensitive fallback
  const lower = eng.toLowerCase()
  const key = Object.keys(MEAL_NAME_TH).find((k) => k.toLowerCase() === lower)
  return key ? MEAL_NAME_TH[key] : eng
}

function translateIngredient(eng: string): string {
  // Exact match first
  if (ING_TH[eng]) return ING_TH[eng]
  // Case-insensitive match
  const lower = eng.toLowerCase()
  const key = Object.keys(ING_TH).find((k) => k.toLowerCase() === lower)
  return key ? ING_TH[key] : eng
}

function extractIngredients(detail: MealDbDetail): string[] {
  const result: string[] = []
  for (let i = 1; i <= 20; i++) {
    const name = detail[`strIngredient${i}`]
    if (name && name.trim()) result.push(translateIngredient(name.trim()))
  }
  return result.slice(0, 8)
}

function jitter(base: number, range: number): number {
  return base + Math.floor(Math.random() * range * 2 - range)
}

function convertToMeal(detail: MealDbDetail, index: number): Meal {
  const cat = detail.strCategory ?? 'Miscellaneous'
  const n = NUTRITION[cat] ?? NUTRITION.Miscellaneous
  const tags = TAGS[cat] ?? []
  const emoji = EMOJI[cat] ?? '🍛'
  const type: MealType = index % 2 === 0 ? 'lunch' : 'dinner'

  return {
    id: `mdb_${detail.idMeal}`,
    name: translateName(detail.strMeal ?? ''),
    type,
    calories: jitter(n.calories, 30),
    price: jitter(n.price, 10),
    protein: n.protein,
    carbs: n.carbs,
    fat: n.fat,
    tags,
    ingredients: extractIngredients(detail),
    emoji,
    imageUrl: detail.strMealThumb ?? undefined,
  }
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function fetchAndCacheThaiMeals(): Promise<Meal[]> {
  // Return cached if still fresh
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (raw) {
      const { meals, ts } = JSON.parse(raw) as { meals: Meal[]; ts: number }
      if (Date.now() - ts < CACHE_TTL_MS) return meals
    }
  } catch {}

  // Fetch list
  const listRes = await fetch(`${BASE}/filter.php?a=Thai`)
  const listData = await listRes.json()
  const items: MealDbListItem[] = listData.meals ?? []

  // Fetch details in parallel (cap at 25)
  const limited = items.slice(0, 25)
  const details = await Promise.all(
    limited.map(async (item) => {
      try {
        const r = await fetch(`${BASE}/lookup.php?i=${item.idMeal}`)
        const d = await r.json()
        return d.meals?.[0] as MealDbDetail | undefined
      } catch {
        return undefined
      }
    })
  )

  const meals = details
    .filter((d): d is MealDbDetail => !!d)
    .map((d, i) => convertToMeal(d, i))

  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ meals, ts: Date.now() }))
  } catch {}

  return meals
}

export async function getCachedThaiMeals(): Promise<Meal[]> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY)
    if (raw) {
      const { meals } = JSON.parse(raw) as { meals: Meal[]; ts: number }
      return meals ?? []
    }
  } catch {}
  return []
}

export async function clearMealDbCache(): Promise<void> {
  await AsyncStorage.removeItem(CACHE_KEY)
}
