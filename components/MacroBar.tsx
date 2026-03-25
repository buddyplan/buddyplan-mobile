import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  protein: number
  carbs: number
  fat: number
}

export default function MacroBar({ protein, carbs, fat }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const total = protein + carbs + fat
  if (total === 0) return null

  const proteinPct = (protein / total) * 100
  const carbsPct   = (carbs / total) * 100
  const fatPct     = (fat / total) * 100

  return (
    <View style={styles.container}>
      <View style={styles.bar}>
        <View style={[styles.segment, { width: `${proteinPct}%`, backgroundColor: C.primary }]} />
        <View style={[styles.segment, { width: `${carbsPct}%`,   backgroundColor: C.secondary }]} />
        <View style={[styles.segment, { width: `${fatPct}%`,     backgroundColor: C.tertiary }]} />
      </View>
      <View style={styles.legend}>
        <LegendItem color={C.primary}   label="โปรตีน" value={`${protein}g`} C={C} />
        <LegendItem color={C.secondary} label="คาร์บ"  value={`${carbs}g`}   C={C} />
        <LegendItem color={C.tertiary}  label="ไขมัน"  value={`${fat}g`}     C={C} />
      </View>
    </View>
  )
}

function LegendItem({ color, label, value, C }: { color: string; label: string; value: string; C: ReturnType<typeof useThemeColors> }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: color }} />
      <Text style={{ fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.textMuted }}>
        {label}
      </Text>
      <Text style={{ fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11, color: C.primary }}>
        {value}
      </Text>
    </View>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    container: { gap: 8 },
    bar: {
      flexDirection: 'row',
      height: 8,
      borderRadius: 4,
      overflow: 'hidden',
      backgroundColor: C.section,
    },
    segment: { height: '100%' },
    legend: { flexDirection: 'row', gap: 12 },
  })
}
