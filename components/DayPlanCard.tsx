import React from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../hooks/useThemeColors'
import { DayPlan, Meal } from '../types'
import MacroRing from './MacroRing'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface MealRowProps {
  meal: Meal
  typeLabel: string
  time: string
  iconName: IoniconsName
  iconColor: string
  iconBg: string
}

function MealRow({ meal, typeLabel, time, iconName, iconColor, iconBg }: MealRowProps) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  return (
    <View style={styles.mealRow}>
      {meal.imageUrl ? (
        <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
      ) : (
        <View style={[styles.mealIcon, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={20} color={iconColor} />
        </View>
      )}
      <View style={styles.mealInfo}>
        <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
        <Text style={styles.mealMeta}>{typeLabel} • {time}</Text>
      </View>
      <Text style={styles.mealCal}>{meal.calories.toLocaleString('th-TH')} kcal</Text>
    </View>
  )
}

interface Props {
  dayPlan: DayPlan
  onPress: () => void
}

export default function DayPlanCard({ dayPlan, onPress }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  const macroData = {
    protein: dayPlan.breakfast.protein + dayPlan.lunch.protein + dayPlan.dinner.protein,
    carbs:   dayPlan.breakfast.carbs   + dayPlan.lunch.carbs   + dayPlan.dinner.carbs,
    fat:     dayPlan.breakfast.fat     + dayPlan.lunch.fat     + dayPlan.dinner.fat,
  }

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.card}>
      {/* Compact MacroRing + totals row */}
      <View style={styles.ringRow}>
        <MacroRing data={macroData} size={72} strokeWidth={9} compact />
        <View style={styles.totals}>
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>{dayPlan.totalCalories.toLocaleString('th-TH')}</Text>
            <Text style={styles.totalLabel}>kcal รวม</Text>
          </View>
          <View style={styles.totalDivider} />
          <View style={styles.totalItem}>
            <Text style={styles.totalValue}>฿{dayPlan.totalPrice.toLocaleString('th-TH')}</Text>
            <Text style={styles.totalLabel}>ค่าอาหาร</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <MealRow
        meal={dayPlan.breakfast}
        typeLabel="มื้อเช้า"
        time="08:30"
        iconName="sunny-outline"
        iconColor="#C8722A"
        iconBg="#FEF0E3"
      />
      <MealRow
        meal={dayPlan.lunch}
        typeLabel="มื้อกลางวัน"
        time="12:00"
        iconName="restaurant-outline"
        iconColor="#C8722A"
        iconBg="#FEF0E3"
      />
      <MealRow
        meal={dayPlan.dinner}
        typeLabel="มื้อเย็น"
        time="18:30"
        iconName="moon-outline"
        iconColor="#4a664b"
        iconBg="#dcfcd9"
      />
    </TouchableOpacity>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    card: {
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20,
      padding: 14,
      gap: 10,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    // Ring row
    ringRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
      paddingHorizontal: 4,
    },
    totals: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 16,
    },
    totalItem: { alignItems: 'center', gap: 2 },
    totalValue: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 18,
      color: '#C8722A',
    },
    totalLabel: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 11,
      color: C.textMuted,
    },
    totalDivider: { width: 1, height: 28, backgroundColor: C.outlineVariant, opacity: 0.5 },

    divider: { height: 1, backgroundColor: C.outlineVariant, opacity: 0.3, marginHorizontal: 4 },

    mealRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    mealIcon: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    mealImage: {
      width: 44,
      height: 44,
      borderRadius: 12,
    },
    mealInfo: {
      flex: 1,
      gap: 3,
    },
    mealName: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 14,
      color: C.text,
    },
    mealMeta: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textMuted,
    },
    mealCal: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13,
      color: C.text,
    },
  })
}
