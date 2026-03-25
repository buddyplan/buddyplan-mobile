import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  Switch, Image, ImageBackground, ScrollView, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router, useLocalSearchParams } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../../hooks/useThemeColors'
import { DietTag, UserProfile } from '../../types'
import { saveProfile, savePlan } from '../../lib/db'
import { generateWeekPlan } from '../../lib/planner'
import { fetchAndCacheThaiMeals } from '../../lib/mealdb'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const SWITCH_COLORS = { false: '#D8D8D0', true: '#C8722A' }

const RESTRICTIONS: { tag: DietTag; iconName: IoniconsName; iconColor: string; iconBg: string; label: string }[] = [
  { tag: 'vegetarian', iconName: 'leaf',          iconColor: '#4a664b', iconBg: '#dcfcd9', label: 'มังสวิรัติ'       },
  { tag: 'no-pork',    iconName: 'ban',            iconColor: '#888',    iconBg: '#EEEEE8', label: 'ไม่กินหมู'        },
  { tag: 'no-beef',    iconName: 'remove-circle',  iconColor: '#888',    iconBg: '#EEEEE8', label: 'ไม่กินเนื้อวัว'   },
  { tag: 'no-seafood', iconName: 'fish',           iconColor: '#888',    iconBg: '#EEEEE8', label: 'ไม่กินอาหารทะเล' },
  { tag: 'no-gluten',  iconName: 'apps',           iconColor: '#888',    iconBg: '#EEEEE8', label: 'ไม่กินกลูเตน'    },
]

export default function RestrictionsScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const { goal, calories, budget } = useLocalSearchParams<{ goal: string; calories: string; budget: string }>()
  const [selected, setSelected] = useState<Set<DietTag>>(new Set())
  const [loading, setLoading] = useState(false)

  const toggleTag = (tag: DietTag) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const handleCreate = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLoading(true)
    try {
      const profile: UserProfile = {
        goal: goal as UserProfile['goal'],
        budgetPerWeek: Number(budget),
        targetCalories: Number(calories),
        dietTags: Array.from(selected),
        createdAt: new Date().toISOString(),
      }
      await saveProfile(profile)
      const extraMeals = await fetchAndCacheThaiMeals().catch(() => [])
      const plan = generateWeekPlan(profile, extraMeals)
      await savePlan(plan)
      router.replace('/(tabs)/home')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.12 }}
      />

      {/* Progress bar */}
      <View style={styles.progressRow}>
        <View style={[styles.progressSeg, styles.progressSegOrange]} />
        <View style={[styles.progressSeg, styles.progressSegOrange]} />
        <View style={[styles.progressSeg, styles.progressSegBrown]} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Bear icon */}
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/singup.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>

        {/* Title */}
        <Text style={styles.heading}>มีข้อจำกัดด้านอาหารไหม?</Text>
        <Text style={styles.sub}>บอกบัดดี้หน่อย เพื่อแผนการกินที่ใช้ที่สุด</Text>

        {/* Restriction rows */}
        <View style={styles.list}>
          {RESTRICTIONS.map(({ tag, iconName, iconColor, iconBg, label }) => {
            const isSelected = selected.has(tag)
            return (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                activeOpacity={0.8}
                style={styles.row}
              >
                <View style={[styles.iconWrap, { backgroundColor: isSelected ? iconBg : '#EEEEE8' }]}>
                  <Ionicons name={iconName} size={22} color={isSelected ? iconColor : '#888'} />
                </View>
                <Text style={styles.rowLabel}>{label}</Text>
                <Switch
                  value={isSelected}
                  onValueChange={() => toggleTag(tag)}
                  trackColor={SWITCH_COLORS}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
            )
          })}
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={styles.bottomWrap}>
        <TouchableOpacity onPress={handleCreate} activeOpacity={0.85} style={styles.createBtn} disabled={loading}>
          <Text style={styles.createBtnText}>{loading ? 'กำลังสร้าง...' : 'สร้างแผนเลย ✦'}</Text>
        </TouchableOpacity>
        <Text style={styles.footer}>คุณสามารถปรับเปลี่ยนได้ภายหลังในหน้าตั้งค่า</Text>
      </View>

      {/* Loading overlay with Buddy */}
      {loading && (
        <View style={styles.overlay}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.overlayLogo}
            resizeMode="contain"
          />
          <Text style={styles.overlayTitle}>กำลังสร้างแผนอาหาร...</Text>
          <Text style={styles.overlaySub}>Buddy กำลังเตรียม 21 มื้อสุดพิเศษให้คุณ ✨</Text>
          <ActivityIndicator color="#C8722A" size="large" style={styles.overlaySpinner} />
        </View>
      )}
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },

    // Progress
    progressRow: {
      flexDirection: 'row',
      gap: 6,
      paddingHorizontal: 24,
      paddingTop: 12,
      paddingBottom: 20,
    },
    progressSeg: { flex: 1, height: 5, borderRadius: 9999 },
    progressSegOrange: { backgroundColor: '#E8914A' },
    progressSegBrown: { backgroundColor: '#5C3D1E' },

    // Scroll
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 24, paddingBottom: 16 },

    // Logo
    logoWrap: { alignItems: 'center', marginBottom: 20 },
    logoImg: { width: 100, height: 100, borderRadius: 24 },

    // Title
    heading: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 26,
      color: C.text,
      lineHeight: 36,
      marginBottom: 6,
    },
    sub: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14,
      color: C.textMuted,
      marginBottom: 24,
    },

    // List
    list: { gap: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 18,
      backgroundColor: C.surfaceContainerLowest,
      gap: 14,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rowLabel: {
      flex: 1,
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 15,
      color: C.text,
    },

    // Bottom
    bottomWrap: { paddingHorizontal: 24, paddingBottom: 24, paddingTop: 8 },
    createBtn: {
      height: 56,
      borderRadius: 9999,
      backgroundColor: '#2D5A1B',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 10,
    },
    createBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 16,
      color: '#fff',
      letterSpacing: 0.3,
    },
    footer: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textMuted,
      textAlign: 'center',
    },

    // Loading overlay
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: C.isDark ? 'rgba(26,25,22,0.97)' : 'rgba(251,249,245,0.97)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      paddingHorizontal: 40,
    },
    overlayLogo: { width: 120, height: 120 },
    overlayTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 22,
      color: '#5C3D1E',
      textAlign: 'center',
    },
    overlaySub: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14,
      color: '#888',
      textAlign: 'center',
    },
    overlaySpinner: { marginTop: 16 },
  })
}
