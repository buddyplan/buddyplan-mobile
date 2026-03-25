import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Image, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../../hooks/useThemeColors'
import { Goal } from '../../types'
import GoalCard from '../../components/GoalCard'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const GOALS: {
  goal: Goal
  iconName: IoniconsName
  iconColor: string
  iconBg: string
  title: string
  subtitle: string
  calories: number
  buddyTip: string
}[] = [
  {
    goal: 'lose',
    iconName: 'flame',
    iconColor: '#C8722A',
    iconBg: '#FEF0E3',
    title: 'ลดน้ำหนัก',
    subtitle: '~1,500 kcal/วัน',
    calories: 1500,
    buddyTip: 'การลดน้ำหนักที่ดีควรค่อยเป็นค่อยไป สัปดาห์ละ 0.5–1 กก. เพื่อให้ร่างกายปรับตัวได้อย่างยั่งยืน',
  },
  {
    goal: 'maintain',
    iconName: 'scale',
    iconColor: '#5C3D1E',
    iconBg: '#FEF0E3',
    title: 'รักษาน้ำหนัก',
    subtitle: '~1,800 kcal/วัน',
    calories: 1800,
    buddyTip: 'การเลือก "รักษาน้ำหนัก" ช่วยให้คุณมีพลังงานเพียงพอสำหรับการใช้ชีวิตประจำวันและออกกำลังกายเบาๆ',
  },
  {
    goal: 'gain',
    iconName: 'barbell',
    iconColor: '#4a664b',
    iconBg: '#FEF0E3',
    title: 'เพิ่มกล้าม',
    subtitle: '~2,200 kcal/วัน',
    calories: 2200,
    buddyTip: 'การเพิ่มกล้ามเนื้อต้องการโปรตีนสูงและแคลอรีเพิ่มเติม ควบคู่กับการออกกำลังกายสม่ำเสมอ',
  },
]

export default function GoalScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)
  const [selected, setSelected] = useState<Goal | null>(null)

  const selectedGoal = GOALS.find((g) => g.goal === selected)

  const handleNext = () => {
    if (!selected) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const goalData = GOALS.find((g) => g.goal === selected)!
    router.push({ pathname: '/onboarding/budget', params: { goal: selected, calories: goalData.calories } })
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
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/iconlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>BuddyPlan</Text>
        </View>
        <TouchableOpacity onPress={() => router.push('/onboarding/splash')} style={styles.closeBtn}>
          <Ionicons name="close" size={18} color="#5e605b" />
        </TouchableOpacity>
      </View>

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={[styles.progressSeg, styles.progressSegActive]} />
        <View style={styles.progressSeg} />
        <View style={styles.progressSeg} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title */}
        <Text style={styles.heading}>อยากให้ Buddy ช่วยเรื่องอะไร?</Text>
        <Text style={styles.sub}>เลือก 1 อย่าง แก้ได้ทีหลัง</Text>

        {/* Cards */}
        <View style={styles.cards}>
          {GOALS.map((g) => (
            <GoalCard
              key={g.goal}
              goal={g.goal}
              iconName={g.iconName}
              iconColor={g.iconColor}
              iconBg={g.iconBg}
              title={g.title}
              subtitle={g.subtitle}
              selected={selected === g.goal}
              onSelect={setSelected}
            />
          ))}
        </View>

        {/* Buddy Tip */}
        {selectedGoal && (
          <View style={styles.tipBox}>
            <View style={styles.tipIconWrap}>
              <Text style={styles.tipIcon}>𝘐</Text>
            </View>
            <Text style={styles.tipText}>
              <Text style={styles.tipBold}>Buddy Tip: </Text>
              {selectedGoal.buddyTip}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom button */}
      <View style={styles.bottomWrap}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={selected ? 0.85 : 1}
          style={[styles.nextBtn, !selected && styles.nextBtnDisabled]}
        >
          <Text style={[styles.nextBtnText, !selected && styles.nextBtnTextDisabled]}>ถัดไป</Text>
        </TouchableOpacity>
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
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 12,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 36, height: 36 },
    headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#5C3D1E' },
    closeBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // Progress
    progressRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 20, marginBottom: 24 },
    progressSeg: { flex: 1, height: 5, borderRadius: 9999, backgroundColor: C.surfaceContainerHighest },
    progressSegActive: { backgroundColor: '#5C3D1E' },

    // Scroll content
    scrollContent: { paddingHorizontal: 20, paddingBottom: 24 },

    // Title
    heading: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 26,
      color: C.text,
      textAlign: 'center',
      lineHeight: 36,
      marginBottom: 8,
    },
    sub: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14,
      color: C.textMuted,
      textAlign: 'center',
      marginBottom: 24,
    },

    // Cards
    cards: { gap: 12 },

    // Buddy Tip
    tipBox: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      backgroundColor: C.tertiaryContainer,
      borderRadius: 16,
      padding: 16,
      marginTop: 20,
    },
    tipIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#fff',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    tipIcon: { fontSize: 16, color: C.textMuted, fontStyle: 'italic' },
    tipText: { flex: 1, fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.text, lineHeight: 20 },
    tipBold: { fontFamily: 'PlusJakartaSans_700Bold' },

    // Bottom
    bottomWrap: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
    nextBtn: {
      height: 56,
      borderRadius: 9999,
      backgroundColor: '#2D5A1B',
      alignItems: 'center',
      justifyContent: 'center',
    },
    nextBtnDisabled: { backgroundColor: C.surfaceContainerHigh },
    nextBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },
    nextBtnTextDisabled: { color: C.textMuted },
  })
}
