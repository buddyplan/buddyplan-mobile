import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../hooks/useThemeColors'
import { Goal } from '../types'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

interface Props {
  goal: Goal
  iconName: IoniconsName
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  selected: boolean
  onSelect: (goal: Goal) => void
}

export default function GoalCard({ goal, iconName, iconColor, iconBg, title, subtitle, selected, onSelect }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onSelect(goal)
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.card, selected && styles.cardSelected]}
    >
      <View style={styles.left}>
        <View style={[styles.iconWrap, { backgroundColor: selected ? '#fff' : iconBg }]}>
          <Ionicons name={iconName} size={26} color={selected ? '#C8722A' : iconColor} />
        </View>
        <View>
          <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
          <Text style={[styles.subtitle, selected && styles.subtitleSelected]}>{subtitle}</Text>
        </View>
      </View>
      <View style={[styles.check, selected && styles.checkSelected]}>
        {selected && <Ionicons name="checkmark" size={14} color="#fff" />}
      </View>
    </TouchableOpacity>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      borderRadius: 20,
      backgroundColor: C.surfaceContainerLowest,
      borderWidth: 1.5,
      borderColor: C.outlineVariant,
    },
    cardSelected: {
      backgroundColor: '#FDE8D4',
      borderColor: '#C8722A',
      borderWidth: 2,
    },
    left: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 14,
    },
    iconWrap: {
      width: 52,
      height: 52,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    title: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 16,
      color: C.text,
      marginBottom: 2,
    },
    titleSelected: { color: '#5C3D1E' },
    subtitle: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 13,
      color: C.textMuted,
    },
    subtitleSelected: { color: '#8B5E3C' },
    check: {
      width: 26,
      height: 26,
      borderRadius: 13,
      borderWidth: 1.5,
      borderColor: C.outlineVariant,
      backgroundColor: C.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkSelected: {
      backgroundColor: '#8B5E3C',
      borderColor: '#8B5E3C',
    },
  })
}
