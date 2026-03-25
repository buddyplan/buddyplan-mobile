import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  label: string
  selected: boolean
  onPress: () => void
}

export default function DayChip({ label, selected, onPress }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onPress()
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <Text style={[styles.label, selected && styles.labelSelected]}>{label}</Text>
    </TouchableOpacity>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    chip: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 9999,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    chipSelected: {
      backgroundColor: '#FDE8D4',
    },
    label: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13,
      color: C.textMuted,
    },
    labelSelected: {
      fontFamily: 'PlusJakartaSans_700Bold',
      color: '#5C3D1E',
    },
  })
}
