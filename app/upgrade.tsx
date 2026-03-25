import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../hooks/useThemeColors'
import {
  getPremiumPackage,
  purchasePremium,
  restorePurchases,
  isPremiumActive,
} from '../lib/revenuecat'
import { activatePremium } from '../lib/subscription'
import type { PurchasesPackage } from 'react-native-purchases'

const FEATURES = [
  {
    icon: 'sparkles' as const,
    color: '#C8722A',
    bg: '#FFF0E6',
    title: 'AI แนะนำเมนู Personalized',
    desc: 'Groq AI วิเคราะห์ preference ของคุณ',
  },
  {
    icon: 'refresh' as const,
    color: '#2D5A1B',
    bg: '#EDF5E8',
    title: 'Regen + Swap ไม่จำกัด',
    desc: 'เปลี่ยนแผนและเมนูได้ทุกเมื่อ',
  },
  {
    icon: 'heart' as const,
    color: '#E04B6E',
    bg: '#FDEDF0',
    title: 'บันทึกเมนูโปรด',
    desc: 'เก็บเมนูที่ชอบ sync ข้ามทุกเครื่อง',
  },
  {
    icon: 'document-text' as const,
    color: '#4A6CF7',
    bg: '#EEF1FE',
    title: 'Export แผนเป็น PDF',
    desc: 'พิมพ์หรือแชร์แผนอาหารประจำสัปดาห์',
  },
  {
    icon: 'time' as const,
    color: '#7C5CFC',
    bg: '#F2EEFF',
    title: 'ดูประวัติแผนอาหาร',
    desc: 'ย้อนดูแผนย้อนหลังได้ทุกสัปดาห์',
  },
  {
    icon: 'flame' as const,
    color: '#F4801A',
    bg: '#FFF3E6',
    title: 'แผน Keto / IF พิเศษ',
    desc: 'ปรับสูตรพิเศษตามรูปแบบการกิน',
  },
]

export default function UpgradeScreen() {
  const C = useThemeColors()
  const S = makeStyles(C)

  const [pkg, setPkg] = useState<PurchasesPackage | null>(null)
  const [loadingPkg, setLoadingPkg] = useState(true)
  const [purchasing, setPurchasing] = useState(false)
  const [restoring, setRestoring] = useState(false)

  useEffect(() => {
    getPremiumPackage().then((p) => {
      setPkg(p)
      setLoadingPkg(false)
    })
  }, [])

  const priceLabel = pkg?.product.priceString ?? '฿99'
  const periodLabel =
    pkg?.product.subscriptionPeriod === 'P1M' || !pkg ? '/เดือน' : ''

  // ─── Purchase ───────────────────────────────────────────────────────────────

  const handlePurchase = async () => {
    if (!pkg) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setPurchasing(true)
    try {
      const result = await purchasePremium(pkg)
      if (result.success) {
        await activatePremium('@buddyplan_profile')
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        Alert.alert(
          'ยินดีด้วย! 🎉',
          'คุณได้รับ BuddyPlan Premium แล้ว ขอบคุณที่สนับสนุนเรา!',
          [{ text: 'เริ่มใช้งาน', onPress: () => router.back() }]
        )
      } else if (!result.cancelled) {
        Alert.alert('เกิดข้อผิดพลาด', result.error)
      }
    } finally {
      setPurchasing(false)
    }
  }

  // ─── Restore ────────────────────────────────────────────────────────────────

  const handleRestore = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setRestoring(true)
    try {
      const result = await restorePurchases()
      if (result.success) {
        const active = await isPremiumActive()
        if (active) {
          await activatePremium('@buddyplan_profile')
          Alert.alert('คืนค่าสำเร็จ', 'พบ Premium subscription ของคุณแล้ว!', [
            { text: 'ตกลง', onPress: () => router.back() },
          ])
        } else {
          Alert.alert('ไม่พบ subscription', 'ไม่พบ Premium subscription ที่ active อยู่')
        }
      } else {
        Alert.alert('เกิดข้อผิดพลาด', result.error)
      }
    } finally {
      setRestoring(false)
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={S.root} edges={['top', 'bottom']}>
      {/* Back button */}
      <TouchableOpacity style={S.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="chevron-back" size={22} color={C.text} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* Hero */}
        <LinearGradient
          colors={['#C8722A', '#9D4E15']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={S.hero}
        >
          <Image
            source={require('../assets/images/logo.png')}
            style={S.heroLogo}
            resizeMode="contain"
          />
          <View style={S.heroBadge}>
            <Ionicons name="sparkles" size={12} color="#C8722A" />
            <Text style={S.heroBadgeText}>PREMIUM</Text>
          </View>
          <Text style={S.heroTitle}>ปลดล็อกทุกฟีเจอร์</Text>
          <Text style={S.heroSub}>แผนอาหารที่ชาญฉลาดกว่า ด้วย AI ที่รู้จักคุณ</Text>
        </LinearGradient>

        {/* Price card */}
        <View style={S.priceCard}>
          {loadingPkg ? (
            <ActivityIndicator color={C.brand} />
          ) : (
            <View style={S.priceRow}>
              <Text style={S.priceAmount}>{priceLabel}</Text>
              <Text style={S.pricePeriod}>{periodLabel}</Text>
            </View>
          )}
          <Text style={S.priceNote}>ยกเลิกได้ตลอดเวลา ไม่ผูกมัด</Text>
        </View>

        {/* Features */}
        <Text style={S.sectionTitle}>สิ่งที่คุณจะได้รับ</Text>
        <View style={S.featureList}>
          {FEATURES.map((f) => (
            <View key={f.title} style={S.featureRow}>
              <View style={[S.featureIcon, { backgroundColor: f.bg }]}>
                <Ionicons name={f.icon} size={20} color={f.color} />
              </View>
              <View style={S.featureText}>
                <Text style={S.featureTitle}>{f.title}</Text>
                <Text style={S.featureDesc}>{f.desc}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Trust badges */}
        <View style={S.trustRow}>
          {[
            { icon: 'shield-checkmark', label: 'ปลอดภัย' },
            { icon: 'card', label: 'ชำระผ่าน App Store' },
            { icon: 'lock-closed', label: 'ไม่เก็บบัตร' },
          ].map((b) => (
            <View key={b.label} style={S.trustBadge}>
              <Ionicons name={b.icon as any} size={14} color={C.textMuted} />
              <Text style={S.trustLabel}>{b.label}</Text>
            </View>
          ))}
        </View>

        <View style={S.spacer} />
      </ScrollView>

      {/* Bottom CTA — fixed */}
      <View style={[S.bottomBar, { borderTopColor: C.cardAlt }]}>
        <TouchableOpacity
          style={[S.subscribeBtn, (purchasing || loadingPkg) && S.disabled]}
          onPress={handlePurchase}
          activeOpacity={0.85}
          disabled={purchasing || loadingPkg || !pkg}
        >
          {purchasing ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="sparkles" size={18} color="#fff" />
              <Text style={S.subscribeBtnText}>
                {loadingPkg ? 'กำลังโหลด...' : `สมัคร Premium ${priceLabel}${periodLabel}`}
              </Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={S.restoreBtn}
          onPress={handleRestore}
          disabled={restoring}
          activeOpacity={0.7}
        >
          {restoring ? (
            <ActivityIndicator color={C.textMuted} size="small" />
          ) : (
            <Text style={S.restoreBtnText}>คืนค่าการซื้อเดิม</Text>
          )}
        </TouchableOpacity>

        <Text style={S.legal}>
          การสมัครจะต่ออายุอัตโนมัติผ่าน{' '}
          {Platform.OS === 'ios' ? 'App Store' : 'Google Play'}{' '}
          ยกเลิกได้ใน Settings ก่อนรอบถัดไป
        </Text>
      </View>
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: C.background },

    backBtn: {
      position: 'absolute', top: 56, left: 16, zIndex: 10,
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },

    scroll: { paddingBottom: 16 },

    // Hero
    hero: {
      paddingTop: 52, paddingBottom: 36, paddingHorizontal: 28,
      alignItems: 'center', gap: 12,
    },
    heroLogo: { width: 72, height: 72, marginBottom: 4 },
    heroBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: '#fff', borderRadius: 99,
      paddingHorizontal: 12, paddingVertical: 4,
    },
    heroBadgeText: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 11, color: '#C8722A', letterSpacing: 1.5,
    },
    heroTitle: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 28, color: '#fff', textAlign: 'center',
    },
    heroSub: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14, color: 'rgba(255,255,255,0.85)', textAlign: 'center',
    },

    // Price card
    priceCard: {
      marginHorizontal: 20, marginTop: -16,
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20, padding: 20, alignItems: 'center', gap: 6,
      shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 },
      elevation: 4,
    },
    priceRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    priceAmount: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 40, color: C.text,
    },
    pricePeriod: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 16, color: C.textMuted,
    },
    priceNote: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12, color: C.textMuted,
    },

    // Features
    sectionTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 16, color: C.text,
      marginTop: 28, marginBottom: 12, marginHorizontal: 20,
    },
    featureList: { paddingHorizontal: 20, gap: 12 },
    featureRow: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 16, padding: 14,
    },
    featureIcon: {
      width: 44, height: 44, borderRadius: 12,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    featureText: { flex: 1, gap: 2 },
    featureTitle: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 14, color: C.text,
    },
    featureDesc: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12, color: C.textMuted,
    },

    // Trust badges
    trustRow: {
      flexDirection: 'row', justifyContent: 'center',
      gap: 16, marginTop: 24, marginHorizontal: 20,
    },
    trustBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    trustLabel: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 11, color: C.textMuted,
    },

    spacer: { height: 16 },

    // Bottom bar
    bottomBar: {
      paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8,
      gap: 10, borderTopWidth: 1,
      backgroundColor: C.background,
    },
    subscribeBtn: {
      height: 56, borderRadius: 9999,
      backgroundColor: '#C8722A',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    subscribeBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 15, color: '#fff',
    },
    disabled: { opacity: 0.6 },
    restoreBtn: { height: 36, alignItems: 'center', justifyContent: 'center' },
    restoreBtnText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 13, color: C.textMuted,
    },
    legal: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 10, color: C.textLight, textAlign: 'center', lineHeight: 15,
    },
  })
}
