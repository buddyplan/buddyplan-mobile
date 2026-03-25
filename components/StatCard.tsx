import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  label: string
  value: string
  unit?: string
}

export default function StatCard({ label, value, unit }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  return (
    <View style={styles.card}>
      <Text style={styles.value}>{value}</Text>
      {unit ? <Text style={styles.unit}>{unit}</Text> : null}
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    card: {
      flex: 1,
      backgroundColor: C.cardAlt,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      gap: 2,
    },
    value: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 18,
      color: C.text,
    },
    unit: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 11,
      color: C.primary,
    },
    label: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10,
      color: C.textMuted,
      textAlign: 'center',
      marginTop: 2,
      textTransform: 'uppercase',
      letterSpacing: 0.55,
    },
  })
}
