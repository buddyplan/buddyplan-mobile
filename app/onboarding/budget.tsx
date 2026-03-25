import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../../hooks/useThemeColors'

export default function BudgetScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const { goal, calories } = useLocalSearchParams<{ goal: string; calories: string }>()
  const [budget, setBudget] = useState(1400)
  const perMeal = Math.round(budget / 21)

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push({ pathname: '/onboarding/restrictions', params: { goal, calories, budget } })
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.12 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color="#5e605b" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.stepLabel}>SETUP STEP 2/3</Text>
          <View style={styles.progressRow}>
            <View style={[styles.progressSeg, styles.progressSegActive]} />
            <View style={[styles.progressSeg, styles.progressSegActive]} />
            <View style={styles.progressSeg} />
          </View>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.container}>
        {/* Title */}
        <Text style={styles.heading}>งบต่อสัปดาห์เท่าไหร่?</Text>
        <Text style={styles.sub}>ปรับเปลี่ยนได้ตามความต้องการของคุณ</Text>

        {/* Budget display */}
        <View style={styles.budgetWrap}>
          <View style={styles.blob} />
          <Text style={styles.budgetLabel}>Weekly Budget</Text>
          <Text style={styles.budgetValue}>฿{budget.toLocaleString('th-TH')}</Text>
          <View style={styles.perMealChip}>
            <Ionicons name="restaurant" size={13} color="#8B5E3C" />
            <Text style={styles.perMealText}> ≈ {perMeal} / มื้อ</Text>
          </View>
        </View>

        {/* Slider */}
        <View style={styles.sliderSection}>
          <Slider
            style={styles.slider}
            minimumValue={500}
            maximumValue={5000}
            step={100}
            value={budget}
            onValueChange={setBudget}
            minimumTrackTintColor="#C8722A"
            maximumTrackTintColor="#E8E8E0"
            thumbTintColor="#C8722A"
          />
          <View style={styles.rangeLabels}>
            <Text style={styles.rangeLabel}>฿500</Text>
            <Text style={styles.rangeLabel}>฿2,500</Text>
            <Text style={styles.rangeLabel}>฿5,000</Text>
          </View>
        </View>

        <View style={{ flex: 1 }} />

        {/* Tip box */}
        <View style={styles.tipBox}>
          <View style={styles.tipIconWrap}>
            <Ionicons name="bulb" size={20} color="#C8722A" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.tipTitle}>ครอบคลุม 3 มื้อ × 7 วัน</Text>
            <Text style={styles.tipText}>
              ราคานี้อ้างอิงจากราคาตลาดถูกเฉลี่ยในตลาด สำหรับแผนอาหาร 21 มื้อ คุณภาพ
            </Text>
          </View>
        </View>

        {/* Button */}
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85} style={styles.nextBtn}>
          <Text style={styles.nextBtnText}>ถัดไป</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>คุณสามารถปรับเปลี่ยนงบประมาณได้ตลอดเวลาในภายหลัง</Text>
      </View>
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 16,
      gap: 12,
    },
    backBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
    stepLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 11,
      color: C.textMuted,
      letterSpacing: 1.2,
    },
    progressRow: { flexDirection: 'row', gap: 6, width: '100%' },
    progressSeg: { flex: 1, height: 5, borderRadius: 9999, backgroundColor: C.surfaceContainerHighest },
    progressSegActive: { backgroundColor: '#C8722A' },

    // Content
    container: { flex: 1, paddingHorizontal: 24, paddingBottom: 32, gap: 12 },
    heading: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 28,
      color: C.text,
      lineHeight: 38,
    },
    sub: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14,
      color: C.textMuted,
    },

    // Budget display
    budgetWrap: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    blob: {
      position: 'absolute',
      width: 280,
      height: 185,
      borderRadius: 25,
      backgroundColor: '#faf3f3',
      opacity: 0.8,
      top: 0,
    },
    budgetLabel: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13,
      color: C.textMuted,
      marginBottom: 4,
    },
    budgetValue: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 64,
      color: '#5C3D1E',
      letterSpacing: -2,
    },
    perMealChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#FDE8D4',
      paddingHorizontal: 14,
      paddingVertical: 6,
      borderRadius: 9999,
      marginTop: 8,
    },
    perMealText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13,
      color: '#8B5E3C',
    },

    // Slider
    sliderSection: { gap: 4 },
    slider: { width: '100%', height: 44 },
    rangeLabels: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    rangeLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textLight },

    // Tip box
    tipBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: C.tertiaryContainer,
      borderRadius: 18,
      padding: 16,
    },
    tipIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
    },
    tipTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 14,
      color: C.text,
      marginBottom: 4,
    },
    tipText: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 13,
      color: C.textMuted,
      lineHeight: 20,
    },

    // Button
    nextBtn: {
      height: 56,
      borderRadius: 9999,
      backgroundColor: '#2D5A1B',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    nextBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },
    footer: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textMuted,
      textAlign: 'center',
      marginTop: 4,
    },
  })
}
