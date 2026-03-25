import React from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Image,
} from 'react-native'
import { router } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../hooks/useThemeColors'
import { Tier } from '../lib/subscription'

export type UpgradeReason = 'regen_limit' | 'favorites' | 'swap' | 'premium_feature'

interface Props {
  visible: boolean
  reason: UpgradeReason
  currentTier: Tier
  onClose: () => void
  onUpgradePremium?: () => void   // called when registered user wants premium
}

const { height } = Dimensions.get('window')

const CONTENT: Record<UpgradeReason, { icon: string; title: string; body: string }> = {
  regen_limit:     { icon: '🔄', title: 'หมดสิทธิ์ Regen แล้ว',    body: 'แผนฟรีใช้ได้ 2 ครั้ง/เดือน\nสมัครฟรีเพื่อ Regen ไม่จำกัด' },
  favorites:       { icon: '❤️', title: 'บันทึกเมนูโปรด',           body: 'สมัครฟรีเพื่อเก็บเมนูโปรด\nและ sync ข้ามทุกเครื่อง' },
  swap:            { icon: '🔀', title: 'เปลี่ยนเมนูได้เลย',        body: 'สมัครฟรีเพื่อ Swap เมนู\nได้ทุกมื้อ ไม่จำกัด' },
  premium_feature: { icon: '✨', title: 'ฟีเจอร์ Premium',           body: 'อัปเกรดเพื่อปลดล็อก AI แนะนำเมนู\nและฟีเจอร์พิเศษทั้งหมด' },
}

const REGISTERED_PERKS = [
  { icon: 'refresh',        label: 'Regen ไม่จำกัด'           },
  { icon: 'heart',          label: 'บันทึกเมนูโปรด'           },
  { icon: 'shuffle',        label: 'Swap เมนูทุกมื้อ'          },
  { icon: 'cloud-upload',   label: 'Sync ข้ามเครื่อง'          },
]

const PREMIUM_PERKS = [
  { icon: 'sparkles',       label: 'AI แนะนำเมนู personalized' },
  { icon: 'document-text',  label: 'Export แผนเป็น PDF'        },
  { icon: 'options',        label: 'ปรับแคลอรี่รายมื้อ'        },
  { icon: 'flame',          label: 'แผน Keto / IF พิเศษ'       },
]

export default function UpgradeModal({ visible, reason, currentTier, onClose, onUpgradePremium }: Props) {
  const C = useThemeColors()
  const slideAnim = React.useRef(new Animated.Value(height)).current

  React.useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [visible])

  const content = CONTENT[reason]
  const showPremiumPerks = currentTier === 'registered' || reason === 'premium_feature'
  const perks = showPremiumPerks ? PREMIUM_PERKS : REGISTERED_PERKS

  const handleRegister = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
    router.push('/auth/register')
  }

  const handlePremium = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    onClose()
    router.push('/upgrade')
    onUpgradePremium?.()
  }

  const S = makeStyles(C)

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Buddy + icon */}
        <View style={S.topRow}>
          <Image source={require('../assets/images/logo.png')} style={S.buddyImg} resizeMode="contain" />
          <View style={S.iconBubble}>
            <Text style={S.iconEmoji}>{content.icon}</Text>
          </View>
        </View>

        <Text style={S.title}>{content.title}</Text>
        <Text style={S.body}>{content.body}</Text>

        {/* Perks list */}
        <View style={S.perksList}>
          {perks.map((p) => (
            <View key={p.icon} style={S.perkRow}>
              <View style={S.perkIconWrap}>
                <Ionicons name={p.icon as any} size={16} color={showPremiumPerks ? '#C8722A' : '#4a664b'} />
              </View>
              <Text style={S.perkLabel}>{p.label}</Text>
            </View>
          ))}
        </View>

        {/* CTAs */}
        {currentTier === 'free' ? (
          <>
            <TouchableOpacity style={S.primaryBtn} onPress={handleRegister} activeOpacity={0.85}>
              <Ionicons name="person-add" size={16} color="#fff" />
              <Text style={S.primaryBtnText}>สมัครฟรี — ไม่มีค่าใช้จ่าย</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={S.secondaryBtnText}>ไว้ทีหลัง</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={[S.primaryBtn, S.premiumBtn]} onPress={handlePremium} activeOpacity={0.85}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={S.primaryBtnText}>อัปเกรด Premium — ฿99/เดือน</Text>
            </TouchableOpacity>
            <TouchableOpacity style={S.secondaryBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={S.secondaryBtnText}>ไว้ทีหลัง</Text>
            </TouchableOpacity>
          </>
        )}

      </Animated.View>
    </Modal>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
    sheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: C.surfaceContainerLowest,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      paddingHorizontal: 24, paddingTop: 28, paddingBottom: 44,
      gap: 16,
    },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 4 },
    buddyImg: { width: 56, height: 56 },
    iconBubble: {
      width: 52, height: 52, borderRadius: 26,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },
    iconEmoji: { fontSize: 26 },
    title: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 22, color: C.text,
    },
    body: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 14, color: C.textMuted, lineHeight: 22,
    },
    perksList: { gap: 10 },
    perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    perkIconWrap: {
      width: 32, height: 32, borderRadius: 10,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },
    perkLabel: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 14, color: C.text,
    },
    primaryBtn: {
      height: 56, borderRadius: 9999,
      backgroundColor: '#2D5A1B',
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    },
    premiumBtn: { backgroundColor: '#C8722A' },
    primaryBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 15, color: '#fff',
    },
    secondaryBtn: {
      height: 44, alignItems: 'center', justifyContent: 'center',
    },
    secondaryBtnText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 14, color: C.textMuted,
    },
  })
}
