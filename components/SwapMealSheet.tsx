import React from 'react'
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Animated,
  Dimensions,
  ScrollView,
  Image,
  Platform,
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Meal } from '../types'
import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  visible: boolean
  mealTypeLabel: string
  currentMealName: string
  alternatives: Meal[]
  onSwap: (meal: Meal) => void
  onClose: () => void
}

const { height } = Dimensions.get('window')

const ICON_BGS   = ['#dcfcd9', '#FDE8D4', '#dcfcd9']
const ICON_COLORS = ['#4a664b', '#C8722A', '#4a664b']

export default function SwapMealSheet({
  visible,
  alternatives,
  onSwap,
  onClose,
}: Props) {
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

  const styles = makeStyles(C)

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="none">
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>

        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>เปลี่ยนเมนู</Text>
            <Text style={styles.subtitle}>เลือกเมนูอื่นที่เหมาะกับคุณในมื้อนี้</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.8}>
            <Ionicons name="close" size={18} color="#5e605b" />
          </TouchableOpacity>
        </View>

        {/* Meal options */}
        <ScrollView showsVerticalScrollIndicator={false} style={styles.list} contentContainerStyle={{ gap: 12 }}>
          {alternatives.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>ไม่มีตัวเลือกเพิ่มเติม</Text>
              <Text style={styles.emptySubText}>ลองปรับข้อจำกัดอาหารดูนะ</Text>
            </View>
          ) : (
            alternatives.map((meal, i) => (
              <View key={meal.id} style={styles.altCard}>
                {meal.imageUrl ? (
                  <Image source={{ uri: meal.imageUrl }} style={styles.altImage} />
                ) : meal.emoji ? (
                  <View style={[styles.altIcon, { backgroundColor: ICON_BGS[i % ICON_BGS.length] }]}>
                    <Text style={styles.altEmoji}>{meal.emoji}</Text>
                  </View>
                ) : (
                  <View style={[styles.altIcon, { backgroundColor: ICON_BGS[i % ICON_BGS.length] }]}>
                    <Ionicons name="restaurant-outline" size={26} color={ICON_COLORS[i % ICON_COLORS.length]} />
                  </View>
                )}
                <View style={styles.altInfo}>
                  <Text style={styles.altName}>{meal.name}</Text>
                  <View style={styles.altMeta}>
                    <View>
                      <Text style={styles.altMetaLabel}>CALS</Text>
                      <Text style={styles.altMetaValue}>{meal.calories}</Text>
                    </View>
                    <View style={styles.altMetaDivider} />
                    <View>
                      <Text style={styles.altMetaLabel}>P/C/F</Text>
                      <Text style={styles.altMetaValue}>{meal.protein}/{meal.carbs}/{meal.fat}</Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => { onSwap(meal); onClose() }}
                  activeOpacity={0.8}
                  style={styles.selectBtn}
                >
                  <Text style={styles.selectBtnText}>เลือก</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </ScrollView>

        {/* Footer note */}
        <View style={styles.footerNote}>
          <Ionicons name="information-circle-outline" size={15} color={C.textMuted} />
          <Text style={styles.footerNoteText}>เมนูแนะนำอ้างอิงจากเป้าหมายสารอาหารที่คุณตั้งไว้</Text>
        </View>

      </Animated.View>
    </Modal>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
    sheet: {
      position: 'absolute',
      bottom: 0, left: 0, right: 0,
      backgroundColor: C.surfaceContainerLowest,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 28,
      paddingTop: 24,
      paddingHorizontal: 20,
      paddingBottom: 40,
      maxHeight: height * 0.8,
    },

    // Header
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 20,
    },
    title: {
      fontFamily: 'PlusJakartaSans_800ExtraBold',
      fontSize: 24,
      color: C.text,
    },
    subtitle: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 13,
      color: C.textMuted,
      marginTop: 2,
    },
    closeBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },

    // List
    list: { flexGrow: 0 },

    // Alt card
    altCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 18,
      padding: 14,
      gap: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: C.outlineVariant,
    },
    altIcon: {
      width: 56, height: 56, borderRadius: 28,
      alignItems: 'center', justifyContent: 'center',
    },
    altImage: {
      width: 56, height: 56, borderRadius: 14,
    },
    altEmoji: {
      fontSize: 26,
      fontFamily: Platform.OS === 'ios' ? 'System' : 'sans-serif',
    },
    altInfo: { flex: 1, gap: 6 },
    altName: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 14,
      color: C.text,
      lineHeight: 20,
    },
    altMeta: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    altMetaLabel: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 10,
      color: C.textMuted,
      letterSpacing: 0.5,
    },
    altMetaValue: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 13,
      color: C.text,
    },
    altMetaDivider: { width: 1, height: 24, backgroundColor: C.outlineVariant },
    selectBtn: {
      backgroundColor: '#C8722A',
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 9999,
    },
    selectBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 13,
      color: '#fff',
    },

    // Footer
    footerNote: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 16,
      paddingHorizontal: 4,
    },
    footerNoteText: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textMuted,
      flex: 1,
    },

    // Empty
    emptyState: { alignItems: 'center', padding: 32 },
    emptyText: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 15,
      color: C.text,
    },
    emptySubText: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 13,
      color: C.textMuted,
      marginTop: 4,
    },
  })
}
