import React, { useState, useCallback, useRef, useEffect } from 'react'
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Image, ImageBackground, Animated } from 'react-native'

function AnimatedItem({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 280, delay: index * 50, useNativeDriver: true }).start()
  }, [])
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
    }}>
      {children}
    </Animated.View>
  )
}
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../../hooks/useThemeColors'
import { loadPlan, saveShoppingChecked, loadShoppingChecked } from '../../lib/db'
import { WeekPlan } from '../../types'
import ShoppingItemRow from '../../components/ShoppingItem'
import NotificationSheet from '../../components/NotificationSheet'

const CATEGORY_CONFIG: Record<string, { label: string }> = {
  meat:      { label: 'PROTEIN'    },
  vegetable: { label: 'VEGETABLES' },
  seasoning: { label: 'PANTRY'     },
  other:     { label: 'OTHER'      },
}
const CATEGORY_ORDER = ['meat', 'vegetable', 'seasoning', 'other']

function formatDate(dateStr: string) {
  const d = new Date(dateStr)
  const months = ['ม.ค.','ก.พ.','มี.ค.','เม.ย.','พ.ค.','มิ.ย.','ก.ค.','ส.ค.','ก.ย.','ต.ค.','พ.ย.','ธ.ค.']
  return `${d.getDate()} ${months[d.getMonth()]}`
}

export default function ShoppingScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const [plan, setPlan] = useState<WeekPlan | null>(null)
  const [checked, setChecked] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [showNotif, setShowNotif] = useState(false)

  const loadData = async () => {
    setLoading(true)
    setLoadError(null)
    try {
      const [p, c] = await Promise.all([loadPlan(), loadShoppingChecked()])
      setPlan(p)
      setChecked(c)
    } catch {
      setLoadError('โหลดรายการซื้อของไม่สำเร็จ กรุณาลองใหม่')
    } finally {
      setLoading(false)
    }
  }

  useFocusEffect(useCallback(() => { loadData() }, []))

  const toggleItem = async (name: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = { ...checked, [name]: !checked[name] }
    setChecked(next)
    await saveShoppingChecked(next)
  }

  const resetAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setChecked({})
    await saveShoppingChecked({})
  }

  const handleShare = async () => {
    if (!plan) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const lines = ['รายการซื้อของ BuddyPlan\n']
    for (const cat of CATEGORY_ORDER) {
      const items = plan.shoppingList.filter((i) => i.category === cat)
      if (items.length === 0) continue
      lines.push(`\n${CATEGORY_CONFIG[cat].label}`)
      items.forEach((item) => {
        lines.push(`${checked[item.name] ? '[v]' : '[ ]'} ${item.name} (${item.quantity}) — ฿${item.estimatedPrice}`)
      })
    }
    lines.push(`\nรวมประมาณ ฿${plan.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0).toLocaleString()}`)
    await Share.share({ message: lines.join('\n') })
  }

  if (loading || !plan) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.loadingBuddy}
            resizeMode="contain"
          />
          {loadError ? (
            <>
              <Text style={styles.errorText}>{loadError}</Text>
              <TouchableOpacity onPress={loadData} style={styles.retryBtn}>
                <Text style={styles.retryText}>ลองใหม่</Text>
              </TouchableOpacity>
            </>
          ) : (
            <Text style={styles.loadingText}>กำลังโหลดรายการ...</Text>
          )}
        </View>
      </SafeAreaView>
    )
  }

  const totalItems   = plan.shoppingList.length
  const checkedCount = Object.values(checked).filter(Boolean).length
  const totalPrice   = plan.shoppingList.reduce((s, i) => s + i.estimatedPrice, 0)
  const progressPct  = totalItems > 0 ? checkedCount / totalItems : 0

  const startDate = plan.days[0]?.date ? formatDate(plan.days[0].date) : ''
  const endDate   = plan.days[plan.days.length - 1]?.date ? formatDate(plan.days[plan.days.length - 1].date) : ''

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.10 }}
      />

      {/* Top header */}
      <View style={styles.topHeader}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/iconlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>BuddyPlan</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={() => setShowNotif(true)}>
          <Ionicons name="notifications-outline" size={20} color="#5C3D1E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Title row */}
        <View style={styles.titleRow}>
          <View>
            <Text style={styles.heading}>รายการที่ต้องซื้อ</Text>
            <Text style={styles.dateRange}>{startDate} – {endDate}</Text>
          </View>
          <View style={styles.countWrap}>
            <Text style={styles.countValue}>{checkedCount}/{totalItems}</Text>
            <Text style={styles.countLabel}>รายการ</Text>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: `${progressPct * 100}%` as any }]} />
        </View>

        {/* Total banner */}
        <View style={styles.banner}>
          <View>
            <Text style={styles.bannerLabel}>ประมาณการรวม</Text>
            <Text style={styles.bannerValue}>฿{totalPrice.toLocaleString('th-TH', { minimumFractionDigits: 2 })}</Text>
          </View>
          <TouchableOpacity onPress={handleShare} activeOpacity={0.85} style={styles.shareBtn}>
            <Ionicons name="share-social-outline" size={16} color="#5C3D1E" />
            <Text style={styles.shareBtnText}>Share</Text>
          </TouchableOpacity>
        </View>

        {/* Category sections */}
        {CATEGORY_ORDER.map((cat, catIdx) => {
          const items = plan.shoppingList.filter((i) => i.category === cat)
          if (items.length === 0) return null
          const sorted = [
            ...items.filter((i) => !checked[i.name]),
            ...items.filter((i) =>  checked[i.name]),
          ]
          return (
            <AnimatedItem key={cat} index={catIdx}>
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>{CATEGORY_CONFIG[cat].label}</Text>
                <View style={styles.sectionCard}>
                  {sorted.map((item, i) => (
                    <View key={item.name}>
                      {i > 0 && <View style={styles.divider} />}
                      <ShoppingItemRow
                        item={{ ...item, checked: checked[item.name] ?? false }}
                        onToggle={() => toggleItem(item.name)}
                      />
                    </View>
                  ))}
                </View>
              </View>
            </AnimatedItem>
          )
        })}

        {/* Reset */}
        <TouchableOpacity onPress={resetAll} activeOpacity={0.7} style={styles.resetBtn}>
          <Ionicons name="refresh" size={15} color="#C8722A" />
          <Text style={styles.resetText}>รีเซ็ตทั้งหมด</Text>
        </TouchableOpacity>

      </ScrollView>

      <NotificationSheet visible={showNotif} onClose={() => setShowNotif(false)} />
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
    loadingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.primary, opacity: 0.6 },
    loadingBuddy: { width: 90, height: 90 },
    loadingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: C.textMuted },
    errorText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: C.error, textAlign: 'center', paddingHorizontal: 24 },
    retryBtn: { marginTop: 8, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: C.primary, borderRadius: 9999 },
    retryText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: C.onPrimary },

    // Top header
    topHeader: {
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
    bellBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 48, gap: 16 },

    // Title row
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    heading: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 30, color: C.text, letterSpacing: -0.5 },
    dateRange: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.textMuted, marginTop: 2 },
    countWrap: { alignItems: 'flex-end' },
    countValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20, color: '#C8722A' },
    countLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted },

    // Progress
    progressTrack: {
      height: 8, borderRadius: 4,
      backgroundColor: C.surfaceContainerHighest,
      overflow: 'hidden',
    },
    progressFill: { height: '100%', backgroundColor: '#5C3D1E', borderRadius: 4 },

    // Banner
    banner: {
      backgroundColor: '#5C3D1E',
      borderRadius: 20,
      padding: 20,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    bannerLabel: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 12, color: 'rgba(255,247,243,0.75)',
      marginBottom: 4,
    },
    bannerValue: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 28, color: '#fff', letterSpacing: -0.5,
    },
    shareBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      backgroundColor: '#fff',
      paddingHorizontal: 18, paddingVertical: 10,
      borderRadius: 9999,
    },
    shareBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#5C3D1E' },

    // Sections
    section: { gap: 8 },
    sectionTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 11, color: C.textMuted,
      letterSpacing: 1.5, paddingLeft: 2,
    },
    sectionCard: {
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 18, overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04, shadowRadius: 8, elevation: 1,
    },
    divider: { height: 1, backgroundColor: C.surfaceContainerLow, marginLeft: 52 },

    // Reset
    resetBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8 },
    resetText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#C8722A' },
  })
}
