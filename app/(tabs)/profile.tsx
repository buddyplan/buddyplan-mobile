import React, { useState, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, Switch, Alert, ActivityIndicator, Image, ImageBackground,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Slider from '@react-native-community/slider'
import { router, useFocusEffect } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../../hooks/useThemeColors'
import { useTheme } from '../../contexts/ThemeContext'
import { loadProfile, saveProfile, savePlan, clearAll, loadFavorites, saveFavorites } from '../../lib/db'
import { generateWeekPlan } from '../../lib/planner'
import { fetchAndCacheThaiMeals } from '../../lib/mealdb'
import { activatePremium, incrementRegenCount } from '../../lib/subscription'
import { signOut } from '../../lib/auth'
import { useSubscription } from '../../hooks/useSubscription'
import UpgradeModal from '../../components/UpgradeModal'
import NotificationSheet from '../../components/NotificationSheet'
import { mealsDB } from '../../lib/meals-db'
import { UserProfile, Goal, DietTag, Meal } from '../../types'
import GoalCard from '../../components/GoalCard'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const GOALS: { goal: Goal; iconName: IoniconsName; iconColor: string; iconBg: string; title: string; subtitle: string; calories: number }[] = [
  { goal: 'lose',     iconName: 'trending-down', iconColor: '#765a3b', iconBg: '#fdd6af', title: 'ลดน้ำหนัก',    subtitle: '~1,500 kcal/วัน', calories: 1500 },
  { goal: 'maintain', iconName: 'pulse',          iconColor: '#4a664b', iconBg: '#dcfcd9', title: 'รักษาน้ำหนัก', subtitle: '~1,800 kcal/วัน', calories: 1800 },
  { goal: 'gain',     iconName: 'barbell',         iconColor: '#725b42', iconBg: '#fdddbd', title: 'เพิ่มกล้าม',    subtitle: '~2,200 kcal/วัน', calories: 2200 },
]

const GOAL_LABELS: Record<Goal, string> = {
  lose: 'ลดน้ำหนัก', maintain: 'รักษาน้ำหนัก', gain: 'เพิ่มกล้าม',
}

const DIET_TAG_TH: Record<DietTag, string> = {
  vegetarian: 'มังสวิรัติ',
  'no-pork':  'ไม่ทานหมู',
  'no-beef':  'ไม่ทานเนื้อวัว',
  'no-seafood': 'แพ้อาหารทะเล',
  'no-gluten': 'ไม่ทานกลูเตน',
}

const RESTRICTIONS: { tag: DietTag; iconName: IoniconsName; iconColor: string; bg: string; label: string }[] = [
  { tag: 'vegetarian', iconName: 'leaf',          iconColor: '#4a664b', bg: '#dcfcd9', label: 'มังสวิรัติ'     },
  { tag: 'no-pork',    iconName: 'close-circle',  iconColor: '#c62828', bg: '#fce4ec', label: 'ไม่ทานหมู'      },
  { tag: 'no-beef',    iconName: 'remove-circle', iconColor: '#b71c1c', bg: '#fce4ec', label: 'ไม่ทานเนื้อวัว' },
  { tag: 'no-seafood', iconName: 'water',          iconColor: '#1565c0', bg: '#e3f2fd', label: 'แพ้อาหารทะเล'  },
  { tag: 'no-gluten',  iconName: 'alert-circle',  iconColor: '#e65100', bg: '#fff8e1', label: 'ไม่ทานกลูเตน'  },
]

const THAI_MONTHS = ['มกราคม','กุมภาพันธ์','มีนาคม','เมษายน','พฤษภาคม','มิถุนายน',
                     'กรกฎาคม','สิงหาคม','กันยายน','ตุลาคม','พฤศจิกายน','ธันวาคม']

function formatThaiDate(iso: string) {
  const d = new Date(iso)
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

function getWeekOfYear() {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 1)
  return Math.ceil(((now.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7)
}

type ModalType = 'goal' | 'budget' | 'restrictions' | null

export default function ProfileScreen() {
  const C = useThemeColors()
  const S = makeStyles(C)
  const { toggleTheme } = useTheme()

  const [profile, setProfile]   = useState<UserProfile | null>(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [modal, setModal]       = useState<ModalType>(null)
  const [editGoal, setEditGoal] = useState<Goal>('maintain')
  const [editBudget, setEditBudget] = useState(1400)
  const [editTags, setEditTags] = useState<Set<DietTag>>(new Set())
  const [favMeals, setFavMeals] = useState<Meal[]>([])
  const [showUpgrade, setShowUpgrade] = useState(false)
  const [showNotif, setShowNotif] = useState(false)

  const subscription = useSubscription(profile?.isPremium)

  useFocusEffect(useCallback(() => {
    ;(async () => {
      setLoading(true)
      const [p, ids] = await Promise.all([loadProfile(), loadFavorites()])
      setProfile(p)
      setFavMeals(mealsDB.filter((m) => ids.includes(m.id)))
      setLoading(false)
    })()
  }, []))

  const openModal = (type: ModalType) => {
    if (!profile) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (type === 'goal')         setEditGoal(profile.goal)
    if (type === 'budget')       setEditBudget(profile.budgetPerWeek)
    if (type === 'restrictions') setEditTags(new Set(profile.dietTags))
    setModal(type)
  }

  const saveModal = async () => {
    if (!profile) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const goalCalories = GOALS.find((g) => g.goal === editGoal)?.calories ?? profile.targetCalories
    const updated: UserProfile = {
      ...profile,
      goal: modal === 'goal' ? editGoal : profile.goal,
      budgetPerWeek: modal === 'budget' ? editBudget : profile.budgetPerWeek,
      targetCalories: modal === 'goal' ? goalCalories : profile.targetCalories,
      dietTags: modal === 'restrictions' ? Array.from(editTags) : profile.dietTags,
    }
    await saveProfile(updated)
    setProfile(updated)
    setModal(null)
  }

  const handleRegen = async () => {
    if (!profile) return
    if (!subscription.canRegen) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
      setShowUpgrade(true)
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setSaving(true)
    const extraMeals = await fetchAndCacheThaiMeals().catch(() => [])
    const newPlan = generateWeekPlan(profile, extraMeals)
    await savePlan(newPlan)
    if (subscription.tier === 'free') await incrementRegenCount()
    subscription.refresh()
    setSaving(false)
    Alert.alert('สำเร็จ', 'สร้างแผนอาหารใหม่เรียบร้อยแล้ว')
  }

  const handleActivatePremium = async () => {
    if (!profile) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    Alert.alert('อัปเกรด Premium', 'ยืนยันการสมัคร Premium ฿99/เดือน?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ยืนยัน', onPress: async () => {
          await activatePremium('@buddyplan_profile')
          const updated = { ...profile, isPremium: true }
          setProfile(updated)
          await saveProfile(updated)
          subscription.refresh()
          Alert.alert('ยินดีด้วย! 🎉', 'คุณได้อัปเกรดเป็น Premium แล้ว')
        },
      },
    ])
  }

  const handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert('เริ่มใหม่ทั้งหมด', 'ข้อมูลทั้งหมดจะถูกลบ คุณแน่ใจไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      { text: 'ลบทั้งหมด', style: 'destructive', onPress: async () => { await clearAll(); router.replace('/onboarding/splash') } },
    ])
  }

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Alert.alert('ออกจากระบบ', 'คุณต้องการออกจากระบบใช่ไหม?', [
      { text: 'ยกเลิก', style: 'cancel' },
      {
        text: 'ออกจากระบบ',
        style: 'destructive',
        onPress: async () => {
          await signOut().catch(() => null)
          await clearAll()
          router.dismissAll()
          router.replace('/onboarding/splash')
        },
      },
    ])
  }

  const toggleTag = (tag: DietTag) => {
    setEditTags((prev) => {
      const next = new Set(prev)
      next.has(tag) ? next.delete(tag) : next.add(tag)
      return next
    })
  }

  const handleToggleTheme = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    toggleTheme()
  }

  if (loading) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}>
          <Image source={require('../../assets/images/logo.png')} style={{ width: 90, height: 90 }} resizeMode="contain" />
          <Text style={S.emptyText}>กำลังโหลด...</Text>
        </View>
      </SafeAreaView>
    )
  }

  if (!profile) {
    return (
      <SafeAreaView style={S.safe}>
        <View style={S.center}><Text style={S.emptyText}>ไม่พบโปรไฟล์</Text></View>
      </SafeAreaView>
    )
  }

  const weekNum    = getWeekOfYear()
  const savedAmt   = Math.round(profile.budgetPerWeek * 0.58 / 10) * 10
  const displayName = `คุณ${profile.name ?? 'เพื่อน'}`

  const handleUnfavorite = async (mealId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = favMeals.filter((m) => m.id !== mealId)
    setFavMeals(next)
    await saveFavorites(next.map((m) => m.id))
  }
  const memberSince = formatThaiDate(profile.createdAt)

  const goalText = (() => {
    const g = GOAL_LABELS[profile.goal]
    return profile.budgetPerWeek <= 2000 ? `${g} & ประหยัดงบ` : g
  })()

  const budgetText = `ไม่เกิน ฿${profile.budgetPerWeek.toLocaleString('th-TH')}`

  const dietText = profile.dietTags.length > 0
    ? profile.dietTags.map((t) => DIET_TAG_TH[t]).join(', ')
    : 'ไม่มีข้อจำกัด'

  return (
    <SafeAreaView style={S.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.10 }}
      />

      {/* Header */}
      <View style={S.header}>
        <View style={S.headerLeft}>
          <Image source={require('../../assets/images/iconlogo.png')} style={S.headerLogo} resizeMode="contain" />
          <Text style={S.headerTitle}>BuddyPlan</Text>
        </View>
        <TouchableOpacity style={S.bellBtn} activeOpacity={0.8} onPress={() => setShowNotif(true)}>
          <Ionicons name="notifications-outline" size={20} color="#5C3D1E" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={S.scroll}>

        {/* Avatar + Name */}
        <View style={S.profileSection}>
          <View style={S.avatarRing}>
            <View style={S.avatarInner}>
              <Ionicons name="person" size={36} color="#C8722A" />
            </View>
          </View>
          <Text style={S.name}>{displayName}</Text>
          <Text style={S.memberSince}>เพื่อนตั้งแต่ {memberSince}</Text>
        </View>

        {/* Stats row */}
        <View style={S.statsRow}>
          <View style={[S.statCard, { backgroundColor: '#F5EDE5' }]}>
            <Text style={[S.statValue, { color: '#5C3D1E' }]}>{weekNum}</Text>
            <Text style={S.statLabel}>สัปดาห์ที่</Text>
          </View>
          <View style={[S.statCard, { backgroundColor: '#dcfcd9' }]}>
            <Text style={[S.statValue, { color: '#C8722A' }]}>฿{savedAmt.toLocaleString()}</Text>
            <Text style={S.statLabel}>ประหยัดแล้ว</Text>
          </View>
          <View style={[S.statCard, { backgroundColor: '#FDE8D4' }]}>
            <Text style={[S.statValue, { color: '#5C3D1E' }]}>{favMeals.length}</Text>
            <Text style={S.statLabel}>เมนูโปรด</Text>
          </View>
        </View>

        {/* Subscription tier banner */}
        {subscription.tier === 'free' && (
          <View style={[S.tierBanner, { backgroundColor: '#FDE8D4' }]}>
            <View style={S.tierBannerLeft}>
              <Ionicons name="person-outline" size={18} color="#C8722A" />
              <View>
                <Text style={[S.tierBannerTitle, { color: '#5C3D1E' }]}>ใช้งานแบบฟรี</Text>
                <Text style={[S.tierBannerSub, { color: '#8C6045' }]}>Regen เหลือ {subscription.remainingRegens}/2 ครั้งเดือนนี้</Text>
              </View>
            </View>
            <TouchableOpacity style={S.tierBannerBtn} onPress={() => setShowUpgrade(true)} activeOpacity={0.85}>
              <Text style={S.tierBannerBtnText}>สมัครฟรี</Text>
            </TouchableOpacity>
          </View>
        )}
        {subscription.tier === 'registered' && (
          <View style={[S.tierBanner, { backgroundColor: '#dcfcd9' }]}>
            <View style={S.tierBannerLeft}>
              <Ionicons name="checkmark-circle" size={18} color="#4a664b" />
              <View>
                <Text style={[S.tierBannerTitle, { color: '#2D5A1B' }]}>สมาชิกฟรี</Text>
                <Text style={[S.tierBannerSub, { color: '#4a664b' }]}>Regen ไม่จำกัด · บันทึกโปรด · Swap ได้</Text>
              </View>
            </View>
            <TouchableOpacity style={[S.tierBannerBtn, { backgroundColor: '#C8722A' }]} onPress={handleActivatePremium} activeOpacity={0.85}>
              <Text style={S.tierBannerBtnText}>Premium</Text>
            </TouchableOpacity>
          </View>
        )}
        {subscription.tier === 'premium' && (
          <View style={[S.tierBanner, { backgroundColor: '#FEF0E3' }]}>
            <View style={S.tierBannerLeft}>
              <Ionicons name="sparkles" size={18} color="#C8722A" />
              <View>
                <Text style={[S.tierBannerTitle, { color: '#5C3D1E' }]}>Premium ✨</Text>
                <Text style={[S.tierBannerSub, { color: '#8C6045' }]}>ปลดล็อกฟีเจอร์ทั้งหมดแล้ว</Text>
              </View>
            </View>
          </View>
        )}

        {/* Settings rows */}
        <View style={S.settingsCard}>
          <SettingRow
            iconName="flag"
            label="เป้าหมาย"
            value={goalText}
            onPress={() => openModal('goal')}
          />
          <View style={S.divider} />
          <SettingRow
            iconName="wallet"
            label="งบต่อสัปดาห์"
            value={budgetText}
            onPress={() => openModal('budget')}
          />
          <View style={S.divider} />
          <SettingRow
            iconName="restaurant"
            label="ข้อจำกัดอาหาร"
            value={dietText}
            onPress={() => openModal('restrictions')}
          />
        </View>

        {/* Favorites section */}
        <View style={S.favSection}>
          <View style={S.favHeader}>
            <Ionicons name="heart" size={16} color="#E05A5A" />
            <Text style={S.favTitle}>เมนูโปรด</Text>
            {favMeals.length > 0 && (
              <View style={S.favCountBadge}>
                <Text style={S.favCountText}>{favMeals.length}</Text>
              </View>
            )}
          </View>

          {favMeals.length === 0 ? (
            <View style={S.favEmpty}>
              <Ionicons name="heart-outline" size={32} color={C.textMuted} />
              <Text style={S.favEmptyText}>ยังไม่มีเมนูโปรด</Text>
              <Text style={S.favEmptySub}>กดไอคอน ♡ บนเมนูในหน้า Day Detail เพื่อเพิ่ม</Text>
            </View>
          ) : (
            favMeals.map((meal) => (
              <View key={meal.id} style={S.favCard}>
                <View style={S.favCardLeft}>
                  <Text style={S.favEmoji}>{meal.emoji}</Text>
                  <View style={S.favCardInfo}>
                    <Text style={S.favMealName} numberOfLines={1}>{meal.name}</Text>
                    <Text style={S.favMealMeta}>{meal.calories} kcal · ฿{meal.price}</Text>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleUnfavorite(meal.id)}
                  style={S.favRemoveBtn}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="heart" size={20} color="#E05A5A" />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Theme toggle */}
        <View style={S.settingsCard}>
          <View style={S.themeRow}>
            <View style={S.settingIconWrap}>
              <Ionicons name="color-palette-outline" size={20} color="#5C3D1E" />
            </View>
            <View style={S.settingInfo}>
              <Text style={S.settingLabel}>ธีมแอป</Text>
              <Text style={S.settingValue}>{C.isDark ? 'โหมดมืด' : 'โหมดสว่าง'}</Text>
            </View>
            <Switch
              value={!C.isDark}
              onValueChange={handleToggleTheme}
              trackColor={{ false: '#ccc', true: '#C8722A' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Generate new plan button */}
        <TouchableOpacity style={S.regenBtn} onPress={handleRegen} activeOpacity={0.85} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <View style={S.regenBtnInner}>
              <Ionicons name="sparkles" size={16} color="#fff" />
              <Text style={S.regenBtnText}>สร้างแผนใหม่</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Footer */}
        <View style={S.footer}>
          <TouchableOpacity style={S.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
            <Ionicons name="log-out-outline" size={18} color="#C0392B" />
            <Text style={S.logoutBtnText}>ออกจากระบบ</Text>
          </TouchableOpacity>
          <Text style={S.versionText}>VERSION 2.4.0 (BUILD 88)</Text>
          <TouchableOpacity onPress={handleReset} activeOpacity={0.8}>
            <Text style={S.resetText}>เริ่มใหม่ทั้งหมด</Text>
          </TouchableOpacity>
          <View style={S.footerIcons}>
            <TouchableOpacity
              style={S.footerIconBtn}
              activeOpacity={0.8}
              onPress={() => Linking.openURL('https://buddyplan.app')}
            >
              <Ionicons name="share-social-outline" size={20} color="#5C3D1E" />
            </TouchableOpacity>
            <TouchableOpacity style={S.footerIconBtn} activeOpacity={0.8}>
              <Ionicons name="help-circle-outline" size={20} color="#5C3D1E" />
            </TouchableOpacity>
          </View>
        </View>

      </ScrollView>

      <NotificationSheet visible={showNotif} onClose={() => setShowNotif(false)} />

      <UpgradeModal
        visible={showUpgrade}
        reason="regen_limit"
        currentTier={subscription.tier}
        onClose={() => setShowUpgrade(false)}
        onUpgradePremium={handleActivatePremium}
      />

      {/* Goal Modal */}
      <Modal visible={modal === 'goal'} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <Text style={S.modalTitle}>เลือกเป้าหมาย</Text>
            {GOALS.map((g) => (
              <GoalCard key={g.goal} goal={g.goal} iconName={g.iconName} iconColor={g.iconColor} iconBg={g.iconBg}
                title={g.title} subtitle={g.subtitle} selected={editGoal === g.goal} onSelect={setEditGoal} />
            ))}
            <TouchableOpacity onPress={saveModal} activeOpacity={0.85} style={S.saveBtn}>
              <Text style={S.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Budget Modal */}
      <Modal visible={modal === 'budget'} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <Text style={S.modalTitle}>งบต่อสัปดาห์</Text>
            <Text style={S.budgetDisplay}>฿{editBudget.toLocaleString('th-TH')}</Text>
            <Text style={S.perMealText}>≈ ฿{Math.round(editBudget / 21).toLocaleString('th-TH')} / มื้อ</Text>
            <Slider
              style={{ width: '100%', height: 44 }}
              minimumValue={500} maximumValue={5000} step={100}
              value={editBudget} onValueChange={setEditBudget}
              minimumTrackTintColor="#C8722A"
              maximumTrackTintColor="#F0E8E0"
              thumbTintColor="#C8722A"
            />
            <View style={S.rangeRow}>
              <Text style={S.rangeLabel}>฿500</Text>
              <Text style={S.rangeLabel}>฿2,500</Text>
              <Text style={S.rangeLabel}>฿5,000</Text>
            </View>
            <TouchableOpacity onPress={saveModal} activeOpacity={0.85} style={S.saveBtn}>
              <Text style={S.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Restrictions Modal */}
      <Modal visible={modal === 'restrictions'} animationType="slide" transparent onRequestClose={() => setModal(null)}>
        <View style={S.modalOverlay}>
          <View style={S.modalSheet}>
            <View style={S.modalHandle} />
            <Text style={S.modalTitle}>ข้อจำกัดอาหาร</Text>
            {RESTRICTIONS.map(({ tag, iconName, iconColor, bg, label }) => (
              <TouchableOpacity key={tag} onPress={() => toggleTag(tag)} activeOpacity={0.8} style={S.restrictionRow}>
                <View style={S.restrictionLeft}>
                  <View style={[S.restrictionIconWrap, { backgroundColor: bg }]}>
                    <Ionicons name={iconName} size={20} color={iconColor} />
                  </View>
                  <Text style={S.restrictionLabel}>{label}</Text>
                </View>
                <Switch
                  value={editTags.has(tag)}
                  onValueChange={() => toggleTag(tag)}
                  trackColor={{ false: '#ccc', true: '#C8722A' }}
                  thumbColor="#fff"
                />
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={saveModal} activeOpacity={0.85} style={S.saveBtn}>
              <Text style={S.saveBtnText}>บันทึก</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

function SettingRow({ iconName, label, value, onPress }: {
  iconName: React.ComponentProps<typeof Ionicons>['name']
  label: string; value: string; onPress: () => void
}) {
  const C = useThemeColors()
  const S = makeStyles(C)
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={S.settingRow}>
      <View style={S.settingIconWrap}>
        <Ionicons name={iconName} size={20} color="#5C3D1E" />
      </View>
      <View style={S.settingInfo}>
        <Text style={S.settingLabel}>{label}</Text>
        <Text style={S.settingValue} numberOfLines={1}>{value}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#C8B09A" />
    </TouchableOpacity>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    emptyText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: C.textMuted },
    scroll: { paddingBottom: 48, gap: 16 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 36, height: 36, borderRadius: 10 },
    headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#5C3D1E' },
    bellBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
    },

    // Profile section
    profileSection: { alignItems: 'center', paddingTop: 8, gap: 6 },
    avatarRing: {
      width: 96, height: 96, borderRadius: 48,
      borderWidth: 3, borderColor: '#C8722A',
      alignItems: 'center', justifyContent: 'center',
      padding: 4,
    },
    avatarInner: {
      flex: 1, width: '100%', borderRadius: 44,
      backgroundColor: '#FEF0E3',
      alignItems: 'center', justifyContent: 'center',
    },
    name: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 26, color: C.text, marginTop: 4 },
    memberSince: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.textMuted },

    // Stats
    statsRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 10 },
    statCard: {
      flex: 1, borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8,
      alignItems: 'center', gap: 4,
    },
    statValue: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 20 },
    statLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: '#7A6050', textAlign: 'center' },

    // Settings card
    settingsCard: {
      marginHorizontal: 20,
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 }, elevation: 1,
    },
    divider: { height: 1, backgroundColor: C.surfaceContainerLow, marginHorizontal: 16 },
    settingRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14, minHeight: 64,
    },
    themeRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: 16, paddingVertical: 14, minHeight: 64,
    },
    settingIconWrap: {
      width: 42, height: 42, borderRadius: 14,
      backgroundColor: '#F5EDE5', alignItems: 'center', justifyContent: 'center',
    },
    settingInfo: { flex: 1 },
    settingLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: C.text },
    settingValue: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: C.textMuted, marginTop: 2 },

    // Regen button
    regenBtn: {
      marginHorizontal: 20, height: 58, borderRadius: 999,
      backgroundColor: '#5C3D1E', alignItems: 'center', justifyContent: 'center',
      shadowColor: '#5C3D1E', shadowOpacity: 0.3, shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 }, elevation: 4,
    },
    regenBtnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    regenBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },

    // Footer
    footer: { alignItems: 'center', gap: 10, paddingTop: 4 },
    logoutBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      paddingVertical: 12, paddingHorizontal: 28,
      borderRadius: 9999, borderWidth: 1.5, borderColor: '#C0392B',
    },
    logoutBtnText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#C0392B' },
    versionText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.textMuted, letterSpacing: 1 },
    resetText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: '#C8722A' },
    footerIcons: { flexDirection: 'row', gap: 16, marginTop: 4 },
    footerIconBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },

    // Modals
    modalOverlay: { flex: 1, backgroundColor: 'rgba(49,51,47,0.4)', justifyContent: 'flex-end' },
    modalSheet: {
      backgroundColor: C.surfaceContainerLowest,
      borderTopLeftRadius: 28, borderTopRightRadius: 28,
      padding: 24, paddingBottom: 44, gap: 14,
    },
    modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: C.surfaceContainerLow, alignSelf: 'center', marginBottom: 4 },
    modalTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 20, color: C.text },
    saveBtn: { height: 56, borderRadius: 999, backgroundColor: '#2D5A1B', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
    saveBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },
    budgetDisplay: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 44, color: '#C8722A', textAlign: 'center', letterSpacing: -1 },
    perMealText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: C.textMuted, textAlign: 'center' },
    rangeRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
    rangeLabel: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted },
    restrictionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
    restrictionLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    restrictionIconWrap: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    restrictionLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 15, color: C.text },

    // Tier banner
    tierBanner: {
      marginHorizontal: 20,
      borderRadius: 18,
      paddingHorizontal: 16, paddingVertical: 14,
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    },
    tierBannerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
    tierBannerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14 },
    tierBannerSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, marginTop: 1 },
    tierBannerBtn: {
      backgroundColor: '#2D5A1B',
      borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8,
    },
    tierBannerBtnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff' },

    // Favorites
    favSection: {
      marginHorizontal: 20,
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20,
      padding: 16,
      gap: 12,
      shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10,
      shadowOffset: { width: 0, height: 3 }, elevation: 1,
    },
    favHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    favTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: C.text, flex: 1 },
    favCountBadge: {
      backgroundColor: '#fce4ec', borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 2,
    },
    favCountText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#E05A5A' },
    favEmpty: { alignItems: 'center', gap: 8, paddingVertical: 20 },
    favEmptyText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: C.textMuted },
    favEmptySub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted, textAlign: 'center' },
    favCard: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surfaceContainerLow,
      borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
    },
    favCardLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
    favEmoji: { fontSize: 28 },
    favCardInfo: { flex: 1, gap: 3 },
    favMealName: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: C.text },
    favMealMeta: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted },
    favRemoveBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  })
}
