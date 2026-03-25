import React, { useCallback, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ImageBackground,
  Alert,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useFocusEffect } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../../hooks/useThemeColors'
import { loadPlan, loadProfile, savePlan } from '../../lib/db'
import { getDayName, generateWeekPlan } from '../../lib/planner'
import { fetchAndCacheThaiMeals } from '../../lib/mealdb'
import { incrementRegenCount } from '../../lib/subscription'
import { useSubscription } from '../../hooks/useSubscription'
import { WeekPlan, UserProfile, DayPlan } from '../../types'
import DayChip from '../../components/DayChip'
import DayPlanCard from '../../components/DayPlanCard'
import BuddyMessage from '../../components/BuddyMessage'
import UpgradeModal from '../../components/UpgradeModal'

const TIPS = [
  'ดื่มน้ำอุ่นหลังตื่นนอน ช่วยให้ระบบเผาผลาญทำงานได้ดีขึ้นนะ!',
  'ทานผักทุกมื้อช่วยให้รู้สึกอิ่มนานขึ้น',
  'ดื่มน้ำก่อนอาหาร 30 นาทีช่วยควบคุมปริมาณที่กินได้',
  'กินข้าวช้าลง 20% ช่วยให้รู้สึกอิ่มเร็วขึ้น',
  'เตรียมอาหารล่วงหน้าช่วยประหยัดเวลาและเงิน',
  'อาหารเช้าสำคัญมาก อย่าข้ามมื้อนะ!',
]

// Seed tip by date so it changes daily
function getDailyTip() {
  const today = new Date().toISOString().split('T')[0]
  const seed = today.split('-').reduce((a, s) => a + Number(s), 0)
  return TIPS[seed % TIPS.length]
}

export default function HomeScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [selectedDay, setSelectedDay] = useState(0)
  const [loading, setLoading] = useState(true)
  const [regenerating, setRegenerating] = useState(false)
  const [showUpgrade, setShowUpgrade] = useState(false)
  const tip = getDailyTip()

  const subscription = useSubscription(profile?.isPremium)

  const loadData = async () => {
    setLoading(true)
    const [savedPlan, pr] = await Promise.all([loadPlan(), loadProfile()])
    setProfile(pr)

    // Check if current plan already includes TheMealDB meals
    const hasApiMeals = savedPlan?.days.some((d) =>
      [d.breakfast, d.lunch, d.dinner].some((m) => m.id.startsWith('mdb_'))
    )

    let activePlan = savedPlan
    if (pr && !hasApiMeals) {
      // First time or plan has no API meals — regenerate with TheMealDB
      const extraMeals = await fetchAndCacheThaiMeals().catch(() => [])
      activePlan = generateWeekPlan(pr, extraMeals)
      await savePlan(activePlan)
    }

    setPlan(activePlan)
    if (activePlan) {
      const today = new Date().toISOString().split('T')[0]
      const idx = activePlan.days.findIndex((d) => d.date === today)
      setSelectedDay(idx >= 0 ? idx : 0)
    }
    setLoading(false)
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  const handleDayPress = (_dayPlan: DayPlan) => {
    router.push({ pathname: '/day-detail', params: { dayIndex: selectedDay, planJson: JSON.stringify(plan) } })
  }

  const handleRegen = async () => {
    if (!profile) return
    if (!subscription.canRegen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setShowUpgrade(true)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setRegenerating(true)
    try {
      const extraMeals = await fetchAndCacheThaiMeals().catch(() => [])
      const newPlan = generateWeekPlan(profile, extraMeals)
      await savePlan(newPlan)
      setPlan(newPlan)
      const today = new Date().toISOString().split('T')[0]
      const idx = newPlan.days.findIndex((d) => d.date === today)
      setSelectedDay(idx >= 0 ? idx : 0)
      if (subscription.tier === 'free') await incrementRegenCount()
      subscription.refresh()
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    } catch {
      Alert.alert('ผิดพลาด', 'ไม่สามารถสร้างแผนใหม่ได้')
    }
    setRegenerating(false)
  }

  if (loading || !plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.loadingBuddy}
            resizeMode="contain"
          />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    )
  }

  const selectedDayPlan = plan.days[selectedDay]
  const pricePerDay = Math.round(plan.totalPrice / 7)

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.10 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/iconlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>BuddyPlan</Text>
        </View>
        <TouchableOpacity
          style={[styles.regenBtn, regenerating && styles.regenBtnActive]}
          activeOpacity={0.8}
          onPress={handleRegen}
          disabled={regenerating}
        >
          <Ionicons name="refresh" size={18} color={regenerating ? '#fff' : '#C8722A'} />
          {subscription.tier === 'free' && !regenerating && (
            <View style={styles.regenBadge}>
              <Text style={styles.regenBadgeText}>{subscription.remainingRegens}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <UpgradeModal
        visible={showUpgrade}
        reason="regen_limit"
        currentTier={subscription.tier}
        onClose={() => setShowUpgrade(false)}
      />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Title with user name */}
        <Text style={styles.heading}>
          {profile?.name ? `สวัสดี, ${profile.name}! 👋\nกินอะไรดีวันนี้?` : 'สวัสดี! วันนี้\nกินอะไรดี? 👋'}
        </Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <View style={styles.statValueRow}>
              <Text style={styles.statValue}>{plan.avgCaloriesPerDay.toLocaleString('th-TH')}</Text>
            </View>
            <View style={styles.statLabelRow}>
              <Text style={styles.statLabel}>KCAL/</Text>
              <Text style={styles.statLabel}>วัน</Text>
            </View>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>฿{pricePerDay.toLocaleString('th-TH')}</Text>
            <Text style={styles.statLabel}>฿/วัน</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>3/3</Text>
            <Text style={styles.statLabel}>มื้อวันนี้</Text>
          </View>
        </View>

        {/* Day Chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          style={styles.chipsScroll}
        >
          {plan.days.map((day, idx) => (
            <DayChip
              key={idx}
              label={getDayName(day.date)}
              selected={selectedDay === idx}
              onPress={() => setSelectedDay(idx)}
            />
          ))}
        </ScrollView>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>แผนการกินวันนี้</Text>
          <TouchableOpacity
            onPress={() => router.push({ pathname: '/day-detail', params: { dayIndex: selectedDay, planJson: JSON.stringify(plan) } })}
            activeOpacity={0.7}
          >
            <Text style={styles.sectionLink}>แก้ไข</Text>
          </TouchableOpacity>
        </View>

        {/* Day Plan Card */}
        {selectedDayPlan && (
          <DayPlanCard dayPlan={selectedDayPlan} onPress={() => handleDayPress(selectedDayPlan)} />
        )}

        {/* Buddy Tip */}
        <View style={styles.tipRow}>
          <BuddyMessage type="tip" message={tip} />
        </View>

      </ScrollView>
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 40, gap: 20 },

    // Loading
    loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingBuddy: { width: 100, height: 100 },
    loadingText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 14,
      color: C.textMuted,
    },

    // Header
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingTop: 8,
      paddingBottom: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 36, height: 36, borderRadius: 10 },
    headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#5C3D1E' },
    regenBtn: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: '#FDE8D4',
      alignItems: 'center',
      justifyContent: 'center',
    },
    regenBtnActive: {
      backgroundColor: '#C8722A',
    },

    // Title
    heading: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 28,
      color: C.text,
      lineHeight: 38,
    },

    // Stats
    statsRow: { flexDirection: 'row', alignItems: 'center' },
    statItem: { flex: 1, alignItems: 'center', gap: 2 },
    statValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 2 },
    statValue: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 22,
      color: '#C8722A',
    },
    statLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    statLabel: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 11,
      color: C.textMuted,
    },
    statDivider: { width: 1, height: 32, backgroundColor: C.outlineVariant, opacity: 0.5 },

    // Chips
    chipsScroll: { flexGrow: 0, marginHorizontal: -20 },
    chips: { paddingHorizontal: 20, gap: 8 },

    // Section
    sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    sectionTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: C.text },
    sectionLink: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#C8722A' },

    // Regen badge
    regenBadge: {
      position: 'absolute', top: -4, right: -4,
      minWidth: 18, height: 18, borderRadius: 9,
      backgroundColor: '#C8722A',
      alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 4,
    },
    regenBadgeText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 10, color: '#fff',
    },

    // Tip
    tipRow: { position: 'relative' },
  })
}
