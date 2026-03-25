import React, { useEffect, useRef } from 'react'
import { View, Text, ActivityIndicator, StyleSheet, Animated } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useThemeColors } from '../hooks/useThemeColors'

interface Props {
  message: string
  type: 'loading' | 'tip' | 'success'
}

export default function BuddyMessage({ message, type }: Props) {
  const C = useThemeColors()
  const styles = makeStyles(C)
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start()
  }, [])

  const isGreen = type === 'tip' || type === 'success'

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: isGreen ? C.tertiaryContainer : C.section },
        { opacity: fadeAnim },
      ]}
    >
      {type === 'loading' ? (
        <ActivityIndicator size="small" color={C.primary} style={styles.spinner} />
      ) : (
        <View style={styles.iconWrap}>
          <Ionicons
            name={type === 'success' ? 'checkmark' : 'leaf'}
            size={16}
            color={C.tertiary}
          />
        </View>
      )}
      <View style={styles.textBlock}>
        {isGreen && <Text style={styles.tipLabel}>Buddy Tip</Text>}
        <Text style={[styles.message, { color: isGreen ? C.text : C.text }]}>
          {message}
        </Text>
      </View>
    </Animated.View>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      padding: 16,
      borderRadius: 24,
      gap: 12,
    },
    spinner: { width: 20, height: 20 },
    iconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(74,102,75,0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 1,
    },
    textBlock: { flex: 1, gap: 3 },
    tipLabel: {
      fontFamily: 'PlusJakartaSans_700Bold',
      fontSize: 13,
      color: C.tertiary,
    },
    message: {
      fontFamily: 'PlusJakartaSans_400Regular',
      fontSize: 13,
      lineHeight: 20,
      color: C.text,
    },
  })
}
