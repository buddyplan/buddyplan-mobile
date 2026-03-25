import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated } from 'react-native'
import Svg, { Circle } from 'react-native-svg'
import { useThemeColors } from '../hooks/useThemeColors'

interface MacroData {
  protein: number
  carbs: number
  fat: number
}

interface Props {
  data: MacroData
  size?: number
  strokeWidth?: number
  compact?: boolean
}

export default function MacroRing({
  data,
  size = 140,
  strokeWidth = 14,
  compact = false,
}: Props) {
  const C = useThemeColors()
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start()
  }, [])

  // Calories per gram: protein=4, carbs=4, fat=9
  const proteinCal = data.protein * 4
  const carbsCal = data.carbs * 4
  const fatCal = data.fat * 9
  const total = proteinCal + carbsCal + fatCal

  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const cx = size / 2
  const cy = size / 2

  function getSegment(valueCal: number, offsetCal: number) {
    const pct = total > 0 ? valueCal / total : 0
    const dash = pct * circumference
    const gap = circumference - dash
    const offset = -(total > 0 ? (offsetCal / total) * circumference : 0)
    return { strokeDasharray: `${dash} ${gap}`, strokeDashoffset: offset }
  }

  const proteinSeg = getSegment(proteinCal, 0)
  const carbsSeg = getSegment(carbsCal, proteinCal)
  const fatSeg = getSegment(fatCal, proteinCal + carbsCal)

  const MACRO_COLORS = {
    protein: C.primary,
    carbs: C.secondaryContainer,
    fat: C.tertiaryContainer,
  }

  const MACRO_LABELS = {
    protein: 'โปรตีน',
    carbs: 'คาร์บ',
    fat: 'ไขมัน',
  }

  const styles = makeStyles(C, size)

  return (
    <Animated.View style={[styles.container, compact && styles.compact, { opacity: fadeAnim }]}>
      {/* Ring */}
      <View style={{ width: size, height: size }}>
        <Svg
          width={size}
          height={size}
          style={{ transform: [{ rotate: '-90deg' }] }}
        >
          {/* Background track */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={C.surfaceContainerHigh}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Protein */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={MACRO_COLORS.protein}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={proteinSeg.strokeDasharray}
            strokeDashoffset={proteinSeg.strokeDashoffset}
          />
          {/* Carbs */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={MACRO_COLORS.carbs}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={carbsSeg.strokeDasharray}
            strokeDashoffset={carbsSeg.strokeDashoffset}
          />
          {/* Fat */}
          <Circle
            cx={cx}
            cy={cy}
            r={radius}
            stroke={MACRO_COLORS.fat}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={fatSeg.strokeDasharray}
            strokeDashoffset={fatSeg.strokeDashoffset}
          />
        </Svg>

        {/* Center text */}
        <View style={styles.center}>
          <Text style={[styles.centerValue, compact && styles.centerValueSm]}>
            {total > 0 ? Math.round(total) : 0}
          </Text>
          <Text style={[styles.centerLabel, compact && styles.centerLabelSm]}>kcal</Text>
        </View>
      </View>

      {/* Legend (full size only) */}
      {!compact && (
        <View style={styles.legend}>
          {(['protein', 'carbs', 'fat'] as const).map((key) => (
            <View key={key} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: MACRO_COLORS[key] }]} />
              <View>
                <Text style={styles.legendLabel}>{MACRO_LABELS[key]}</Text>
                <Text style={styles.legendValue}>{data[key]}g</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme, size: number) {
  return StyleSheet.create({
    container: {
      alignItems: 'center',
      gap: 20,
    },
    compact: {
      gap: 0,
    },
    center: {
      position: 'absolute',
      width: size,
      height: size,
      alignItems: 'center',
      justifyContent: 'center',
    },
    centerValue: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 22,
      color: C.text,
    },
    centerValueSm: {
      fontSize: 13,
      fontFamily: 'PlusJakartaSans_700Bold',
    },
    centerLabel: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 11,
      color: C.textMuted,
    },
    centerLabelSm: {
      fontSize: 9,
    },
    legend: {
      flexDirection: 'row',
      gap: 20,
      justifyContent: 'center',
    },
    legendItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 7,
    },
    legendDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    legendLabel: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 11,
      color: C.textMuted,
    },
    legendValue: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 13,
      color: C.text,
    },
  })
}
