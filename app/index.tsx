import { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet, Animated, Image } from 'react-native'
import { Redirect } from 'expo-router'
import { loadProfile } from '../lib/db'
import { colors } from '../constants/colors'

export default function Index() {
  const [destination, setDestination] = useState<string | null>(null)
  const [animDone, setAnimDone] = useState(false)

  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.8)).current
  const taglineOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    loadProfile().then((profile) => {
      setDestination(profile ? '/(tabs)/home' : '/onboarding/splash')
    })

    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()

    setTimeout(() => {
      Animated.timing(taglineOpacity, { toValue: 1, duration: 400, useNativeDriver: true })
        .start(() => setTimeout(() => setAnimDone(true), 400))
    }, 300)
  }, [])

  if (destination && animDone) {
    return <Redirect href={destination as any} />
  }

  return (
    <View style={styles.container}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={require('../assets/images/iconlogo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      <Animated.View style={[styles.wordmarkWrap, { opacity: logoOpacity }]}>
        <Text style={styles.wordmark}>BuddyPlan</Text>
      </Animated.View>

      <Animated.View style={{ opacity: taglineOpacity, marginTop: 6 }}>
        <Text style={styles.tagline}>your meal planning buddy 🍱</Text>
      </Animated.View>

      <View style={styles.dotsRow}>
        <View style={styles.dot} />
        <View style={styles.dot} />
        <View style={styles.dot} />
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fde8d4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 220,
    height: 220,
  },
  wordmarkWrap: {
    marginTop: 12,
  },
  wordmark: {
    fontFamily: 'PlusJakartaSans_800ExtraBold',
    fontSize: 32,
    color: '#7B4A1E',
    letterSpacing: -0.5,
  },
  tagline: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 15,
    color: colors.muted,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 48,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#b8c9b8',
  },
})
