import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  Animated, Dimensions, Switch, Alert, ScrollView,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useThemeColors } from '../hooks/useThemeColors'
import {
  NotificationPrefs, DEFAULT_PREFS,
  loadNotifPrefs, saveNotifPrefs, scheduleAll, requestPermission,
} from '../lib/notifications'

interface Props {
  visible: boolean
  onClose: () => void
}

const { height } = Dimensions.get('window')

const HOURS = Array.from({ length: 24 }, (_, i) => i)

function pad(n: number) { return String(n).padStart(2, '0') }
function fmt(h: number, m: number) { return `${pad(h)}:${pad(m)}` }

export default function NotificationSheet({ visible, onClose }: Props) {
  const C = useThemeColors()
  const S = makeStyles(C)
  const slideAnim = React.useRef(new Animated.Value(height)).current

  const [prefs, setPrefs] = useState<NotificationPrefs>(DEFAULT_PREFS)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifPrefs().then((p) => { setPrefs(p); setLoading(false) })
  }, [])

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: visible ? 0 : height,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start()
  }, [visible])

  const handleToggleMaster = async (val: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (val) {
      const granted = await requestPermission()
      if (!granted) {
        Alert.alert('ไม่ได้รับสิทธิ์', 'กรุณาเปิดการแจ้งเตือนใน Settings ของเครื่องก่อน')
        return
      }
    }
    const next = { ...prefs, enabled: val }
    setPrefs(next)
    await saveNotifPrefs(next)
    await scheduleAll(next)
  }

  const handleToggle = async (key: keyof NotificationPrefs) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    const next = { ...prefs, [key]: !prefs[key as keyof NotificationPrefs] }
    setPrefs(next)
    await saveNotifPrefs(next)
    await scheduleAll(next)
  }

  const handleHourChange = async (
    hourKey: 'breakfastHour' | 'lunchHour' | 'dinnerHour',
    delta: number,
  ) => {
    Haptics.selectionAsync()
    const current = prefs[hourKey]
    const next = { ...prefs, [hourKey]: (current + delta + 24) % 24 }
    setPrefs(next)
    await saveNotifPrefs(next)
    await scheduleAll(next)
  }

  if (loading) return null

  const rows: {
    key: keyof NotificationPrefs
    icon: React.ComponentProps<typeof Ionicons>['name']
    iconColor: string
    iconBg: string
    label: string
    sub: string
    hourKey?: 'breakfastHour' | 'lunchHour' | 'dinnerHour'
    minuteKey?: 'breakfastMinute' | 'lunchMinute' | 'dinnerMinute'
  }[] = [
    { key: 'breakfast', icon: 'sunny-outline',     iconColor: '#C8722A', iconBg: '#FDE8D4', label: 'มื้อเช้า',      sub: 'แจ้งเตือนตอนเช้า',   hourKey: 'breakfastHour', minuteKey: 'breakfastMinute' },
    { key: 'lunch',     icon: 'restaurant-outline', iconColor: '#4a664b', iconBg: '#dcfcd9', label: 'มื้อกลางวัน',   sub: 'แจ้งเตือนตอนเที่ยง', hourKey: 'lunchHour',     minuteKey: 'lunchMinute'     },
    { key: 'dinner',    icon: 'moon-outline',       iconColor: '#5C3D1E', iconBg: '#F5EDE5', label: 'มื้อเย็น',       sub: 'แจ้งเตือนตอนเย็น',   hourKey: 'dinnerHour',    minuteKey: 'dinnerMinute'    },
    { key: 'shopping',  icon: 'cart-outline',       iconColor: '#1565c0', iconBg: '#e3f2fd', label: 'ซื้อของสัปดาห์', sub: 'ทุกวันอาทิตย์ 10:00' },
  ]

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity style={S.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[S.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Header */}
        <View style={S.header}>
          <View style={S.headerLeft}>
            <Ionicons name="notifications" size={20} color="#C8722A" />
            <Text style={S.headerTitle}>การแจ้งเตือน</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={S.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={20} color={C.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Master toggle */}
        <View style={S.masterRow}>
          <View style={S.masterInfo}>
            <Text style={S.masterLabel}>เปิดการแจ้งเตือน</Text>
            <Text style={S.masterSub}>รับการแจ้งเตือนมื้ออาหารจาก Buddy</Text>
          </View>
          <Switch
            value={prefs.enabled}
            onValueChange={handleToggleMaster}
            trackColor={{ false: '#ccc', true: '#C8722A' }}
            thumbColor="#fff"
          />
        </View>

        <View style={S.divider} />

        {/* Meal rows */}
        <ScrollView scrollEnabled={false}>
          {rows.map((row) => (
            <View key={String(row.key)} style={[S.row, !prefs.enabled && S.rowDisabled]}>
              <View style={[S.rowIconWrap, { backgroundColor: row.iconBg }]}>
                <Ionicons name={row.icon} size={18} color={row.iconColor} />
              </View>
              <View style={S.rowInfo}>
                <Text style={S.rowLabel}>{row.label}</Text>
                <Text style={S.rowSub}>{row.sub}</Text>
              </View>

              {row.hourKey && (
                <View style={[S.timePicker, !prefs[row.key as keyof NotificationPrefs] && S.timePickerDisabled]}>
                  <TouchableOpacity
                    onPress={() => row.hourKey && handleHourChange(row.hourKey, -1)}
                    disabled={!prefs.enabled || !prefs[row.key as keyof NotificationPrefs]}
                    style={S.timeArrow}
                  >
                    <Ionicons name="chevron-back" size={14} color={C.textMuted} />
                  </TouchableOpacity>
                  <Text style={S.timeText}>
                    {fmt(prefs[row.hourKey], prefs[row.minuteKey!])}
                  </Text>
                  <TouchableOpacity
                    onPress={() => row.hourKey && handleHourChange(row.hourKey, 1)}
                    disabled={!prefs.enabled || !prefs[row.key as keyof NotificationPrefs]}
                    style={S.timeArrow}
                  >
                    <Ionicons name="chevron-forward" size={14} color={C.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              <Switch
                value={!!prefs[row.key as keyof NotificationPrefs]}
                onValueChange={() => handleToggle(row.key)}
                disabled={!prefs.enabled}
                trackColor={{ false: '#ccc', true: '#4a664b' }}
                thumbColor="#fff"
              />
            </View>
          ))}
        </ScrollView>

        <Text style={S.note}>การแจ้งเตือนจะทำงานแม้ปิดแอปอยู่</Text>

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
      paddingHorizontal: 24, paddingTop: 20, paddingBottom: 44,
      gap: 12,
    },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 18, color: C.text },
    closeBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },
    masterRow: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: C.surfaceContainerLow,
      borderRadius: 16, padding: 14, gap: 12,
    },
    masterInfo: { flex: 1 },
    masterLabel: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 15, color: C.text },
    masterSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted, marginTop: 2 },
    divider: { height: 1, backgroundColor: C.surfaceContainerLow },
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingVertical: 10,
    },
    rowDisabled: { opacity: 0.4 },
    rowIconWrap: {
      width: 36, height: 36, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
    },
    rowInfo: { flex: 1 },
    rowLabel: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: C.text },
    rowSub: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 12, color: C.textMuted },
    timePicker: {
      flexDirection: 'row', alignItems: 'center', gap: 2,
      backgroundColor: C.surfaceContainerLow,
      borderRadius: 10, paddingVertical: 4, paddingHorizontal: 6,
    },
    timePickerDisabled: { opacity: 0.4 },
    timeArrow: { padding: 4 },
    timeText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: C.text, minWidth: 38, textAlign: 'center' },
    note: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 4 },
  })
}
