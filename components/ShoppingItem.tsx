import React from 'react'
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../hooks/useThemeColors'
import { ShoppingItem as ShoppingItemType } from '../types'

interface Props {
  item: ShoppingItemType
  onToggle: () => void
}

export default function ShoppingItemRow({ item, onToggle }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)

  const handleToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onToggle()
  }

  return (
    <TouchableOpacity onPress={handleToggle} activeOpacity={0.8} style={styles.row}>
      <View style={[styles.checkbox, item.checked && styles.checkboxChecked]}>
        {item.checked && <Ionicons name="checkmark" size={13} color="#fff" />}
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, item.checked && styles.nameChecked]}>{item.name}</Text>
        <Text style={[styles.meta, item.checked && styles.metaChecked]}>
          {item.quantity} • ฿{item.estimatedPrice}
        </Text>
      </View>
    </TouchableOpacity>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      gap: 14,
    },
    checkbox: {
      width: 24,
      height: 24,
      borderRadius: 6,
      borderWidth: 1.5,
      borderColor: C.outlineVariant,
      backgroundColor: C.surfaceContainerLowest,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: '#C8722A',
      borderColor: '#C8722A',
    },
    info: { flex: 1 },
    name: {
      fontFamily: 'PlusJakartaSans_600SemiBold',
      fontSize: 14,
      color: C.text,
    },
    nameChecked: {
      textDecorationLine: 'line-through',
      color: C.outlineVariant,
    },
    meta: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 12,
      color: C.textMuted,
      marginTop: 2,
    },
    metaChecked: {
      color: C.outlineVariant,
    },
  })
}
