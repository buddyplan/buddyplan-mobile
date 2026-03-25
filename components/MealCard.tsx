import React from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../hooks/useThemeColors'
import { Meal } from '../types'
import MacroBar from './MacroBar'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface Props {
  meal: Meal
  mealTypeLabel: string
  mealType: 'breakfast' | 'lunch' | 'dinner'
  isFavorite?: boolean
  onToggleFavorite?: () => void
  onSwap?: () => void
}

const MEAL_ACCENT: Record<string, string> = {
  breakfast: '#4a664b',
  lunch:     '#C8722A',
  dinner:    '#C8722A',
}

const MEAL_ICON_BG: Record<string, string> = {
  breakfast: '#dcfcd9',
  lunch:     '#FDE8D4',
  dinner:    '#FDE8D4',
}

const MEAL_ICON: Record<string, IoniconsName> = {
  breakfast: 'sunny-outline',
  lunch:     'restaurant-outline',
  dinner:    'moon-outline',
}

export default function MealCard({ meal, mealTypeLabel, mealType, isFavorite = false, onToggleFavorite, onSwap }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const accent   = MEAL_ACCENT[mealType]  ?? C.primary
  const iconBg   = MEAL_ICON_BG[mealType] ?? C.primaryContainer
  const iconName = MEAL_ICON[mealType]    ?? 'restaurant-outline'

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggleFavorite?.()
  }

  return (
    <View style={styles.card}>
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: accent }]} />

      {/* Icon or image */}
      {meal.imageUrl ? (
        <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
      ) : (
        <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
          <Ionicons name={iconName} size={30} color={accent} />
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {/* Header row: label + heart */}
        <View style={styles.headerRow}>
          <Text style={[styles.typeLabel, { color: accent }]}>{mealTypeLabel}</Text>
          <TouchableOpacity
            onPress={handleFavorite}
            activeOpacity={0.7}
            style={styles.heartBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={20}
              color={isFavorite ? '#E05A5A' : C.textMuted}
            />
          </TouchableOpacity>
        </View>

        <Text style={styles.mealName}>{meal.name}</Text>

        <View style={styles.pillRow}>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{meal.calories.toLocaleString('th-TH')} kcal</Text>
          </View>
          <View style={styles.pill}>
            <Text style={styles.pillText}>฿{meal.price.toLocaleString('th-TH')}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ingredientScroll}>
          {meal.ingredients.map((ing, i) => (
            <View key={i} style={styles.ingredientChip}>
              <Text style={styles.ingredientText}>{ing}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Macro bar */}
        <MacroBar protein={meal.protein} carbs={meal.carbs} fat={meal.fat} />

        {/* Swap button */}
        {onSwap && (
          <TouchableOpacity onPress={onSwap} activeOpacity={0.8} style={styles.swapBtn}>
            <Ionicons name="shuffle-outline" size={14} color={accent} />
            <Text style={[styles.swapBtnText, { color: accent }]}>เปลี่ยนเมนู</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 12,
      elevation: 2,
      paddingRight: 16,
      paddingVertical: 16,
    },
    accentBar: {
      width: 4,
      alignSelf: 'stretch',
      borderRadius: 2,
    },
    iconCircle: {
      width: 68,
      height: 68,
      borderRadius: 34,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
      marginLeft: 14,
    },
    mealImage: {
      width: 68,
      height: 68,
      borderRadius: 16,
      flexShrink: 0,
      marginLeft: 14,
    },
    content: { flex: 1, gap: 6, marginLeft: 14 },

    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    typeLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 11,
      letterSpacing: 1.2,
    },
    heartBtn: {
      width: 44,
      height: 44,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: -8,
      marginTop: -10,
    },

    mealName: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 17,
      color: C.text,
      lineHeight: 22,
    },
    pillRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    pill: {
      backgroundColor: C.surfaceContainerLow,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
    },
    pillText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12,
      color: C.textMuted,
    },
    ingredientScroll: { flexGrow: 0 },
    ingredientChip: {
      backgroundColor: C.surfaceContainer,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 9999,
      marginRight: 6,
    },
    ingredientText: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textLight,
    },

    swapBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      alignSelf: 'flex-start',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: 9999,
      backgroundColor: C.surfaceContainerLow,
    },
    swapBtnText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12,
    },
  })
}
