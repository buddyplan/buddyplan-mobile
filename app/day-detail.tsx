import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../hooks/useThemeColors'
import { useSubscription } from '../hooks/useSubscription'
import { WeekPlan, Meal, UserProfile } from '../types'
import { getDayName, getAlternatives, swapMeal } from '../lib/planner'
import { loadProfile, savePlan, loadFavorites, saveFavorites } from '../lib/db'
import { getCachedThaiMeals } from '../lib/mealdb'
import MealCard from '../components/MealCard'
import SwapMealSheet from '../components/SwapMealSheet'
import MacroRing from '../components/MacroRing'
import UpgradeModal, { UpgradeReason } from '../components/UpgradeModal'

const DAY_TH: Record<string, string> = {
  จันทร์: 'Monday',
  อังคาร: 'Tuesday',
  พุธ: 'Wednesday',
  พฤหัสบดี: 'Thursday',
  ศุกร์: 'Friday',
  เสาร์: 'Saturday',
  อาทิตย์: 'Sunday',
}

export default function DayDetailScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const { dayIndex, planJson } = useLocalSearchParams<{ dayIndex: string; planJson: string }>()
  const [plan, setPlan] = useState<WeekPlan>(JSON.parse(planJson ?? '{}'))
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [extraMeals, setExtraMeals] = useState<Meal[]>([])
  const [favorites, setFavorites] = useState<Set<string>>(new Set())
  const [swapSheet, setSwapSheet] = useState<{
    visible: boolean
    mealType: 'breakfast' | 'lunch' | 'dinner'
  }>({ visible: false, mealType: 'lunch' })
  const [upgradeReason, setUpgradeReason] = useState<UpgradeReason>('swap')
  const [showUpgrade, setShowUpgrade] = useState(false)

  const subscription = useSubscription(profile?.isPremium)

  const idx = Number(dayIndex ?? 0)
  const dayPlan = plan.days[idx]

  useEffect(() => {
    loadProfile().then(setProfile)
    loadFavorites().then((ids) => setFavorites(new Set(ids)))
    getCachedThaiMeals().then(setExtraMeals)
  }, [])

  if (!dayPlan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: C.text }}>ไม่พบข้อมูล</Text>
        </View>
      </SafeAreaView>
    )
  }

  const dayName = getDayName(dayPlan.date)
  const dayEN = DAY_TH[dayName] ?? dayName

  const handleSwap = (mealType: 'breakfast' | 'lunch' | 'dinner') => {
    if (!subscription.canSwap) {
      setUpgradeReason('swap')
      setShowUpgrade(true)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSwapSheet({ visible: true, mealType })
  }

  const currentSwapMeal = dayPlan[swapSheet.mealType]
  const alternatives = profile
    ? getAlternatives(swapSheet.mealType, currentSwapMeal, plan, profile, extraMeals)
    : []

  const confirmSwap = (newMeal: Meal) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const updatedPlan = swapMeal(plan, idx, swapSheet.mealType, newMeal)
    setPlan(updatedPlan)
    savePlan(updatedPlan)
  }

  const toggleFavorite = (mealId: string) => {
    if (!subscription.canFavorite) {
      setUpgradeReason('favorites')
      setShowUpgrade(true)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = new Set(favorites)
    if (next.has(mealId)) next.delete(mealId)
    else next.add(mealId)
    setFavorites(next)
    saveFavorites(Array.from(next))
  }

  const MEAL_TYPE_LABEL: Record<string, string> = {
    breakfast: 'BREAKFAST',
    lunch: 'LUNCH',
    dinner: 'DINNER',
  }

  const meals: { type: 'breakfast' | 'lunch' | 'dinner'; meal: Meal }[] = [
    { type: 'breakfast', meal: dayPlan.breakfast },
    { type: 'lunch',     meal: dayPlan.lunch     },
    { type: 'dinner',    meal: dayPlan.dinner    },
  ]

  const protein = dayPlan.breakfast.protein + dayPlan.lunch.protein + dayPlan.dinner.protein
  const carbs   = dayPlan.breakfast.carbs   + dayPlan.lunch.carbs   + dayPlan.dinner.carbs
  const fat     = dayPlan.breakfast.fat     + dayPlan.lunch.fat     + dayPlan.dinner.fat

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.10 }}
      />

      {/* NavBar */}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.8}>
          <Ionicons name="arrow-back" size={18} color="#5C3D1E" />
        </TouchableOpacity>
        <Text style={styles.navTitle}>{dayEN} Plan</Text>
        <Image source={require('../assets/images/iconlogo.png')} style={styles.navLogo} resizeMode="contain" />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* MacroRing 160px with legend */}
        <View style={styles.ringCard}>
          <Text style={styles.ringCardLabel}>TOTAL</Text>
          <MacroRing data={{ protein, carbs, fat }} size={160} strokeWidth={16} />
          <Text style={styles.ringCardKcal}>{dayPlan.totalCalories.toLocaleString('th-TH')} kcal</Text>
        </View>

        {/* Daily Meals */}
        <Text style={styles.sectionTitle}>Daily Meals</Text>

        {meals.map(({ type, meal }) => (
          <MealCard
            key={type}
            meal={meal}
            mealTypeLabel={MEAL_TYPE_LABEL[type]}
            mealType={type}
            isFavorite={favorites.has(meal.id)}
            onToggleFavorite={() => toggleFavorite(meal.id)}
            onSwap={() => handleSwap(type)}
          />
        ))}

      </ScrollView>

      <SwapMealSheet
        visible={swapSheet.visible}
        mealTypeLabel={MEAL_TYPE_LABEL[swapSheet.mealType]}
        currentMealName={currentSwapMeal.name}
        alternatives={alternatives}
        onSwap={confirmSwap}
        onClose={() => setSwapSheet({ visible: false, mealType: 'lunch' })}
      />

      <UpgradeModal
        visible={showUpgrade}
        reason={upgradeReason}
        currentTier={subscription.tier}
        onClose={() => setShowUpgrade(false)}
      />
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
    },
    backBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },
    navTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 18,
      color: '#5C3D1E',
    },
    navLogo: { width: 40, height: 40, borderRadius: 12 },

    content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 48, gap: 20 },

    // MacroRing card
    ringCard: {
      backgroundColor: '#FEF0E3',
      borderRadius: 24,
      alignItems: 'center',
      paddingVertical: 28,
      paddingHorizontal: 20,
      gap: 16,
    },
    ringCardLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 11,
      color: C.textMuted,
      letterSpacing: 2,
    },
    ringCardKcal: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 20,
      color: '#5C3D1E',
    },

    sectionTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 22,
      color: C.text,
    },
  })
}
