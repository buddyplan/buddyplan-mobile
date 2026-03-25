import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet, Animated, TouchableOpacity, ImageBackground, Image } from 'react-native'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'

export default function SplashScreen() {
  const logoOpacity = useRef(new Animated.Value(0)).current
  const logoScale = useRef(new Animated.Value(0.85)).current
  const textOpacity = useRef(new Animated.Value(0)).current
  const buttonsTranslate = useRef(new Animated.Value(60)).current
  const buttonsOpacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(logoScale, { toValue: 1, tension: 60, friction: 8, useNativeDriver: true }),
      Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start()
    setTimeout(() => Animated.timing(textOpacity, { toValue: 1, duration: 400, useNativeDriver: true }).start(), 400)
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonsTranslate, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(buttonsOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
      ]).start()
    }, 700)
  }, [])

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/onboarding/goal')
  }
  const handleLogin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push('/auth/login')
  }

  return (
    <View style={styles.bg}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.15 }}
      />
      <View style={styles.container}>
        {/* Logo Card */}
        <Animated.View style={[styles.logoCard, { opacity: logoOpacity, transform: [{ scale: logoScale }] }]}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.bearImage}
            resizeMode="contain"
          />
        </Animated.View>

        {/* Greeting */}
        <Animated.View style={[styles.greetingWrap, { opacity: textOpacity }]}>
          <Text style={styles.greetingTitle}>{'สวัสดี! ฉันคือ\nBuddy'}</Text>
          <Text style={styles.greetingSub}>จะช่วยดูแลเรื่องกินให้นะ {'🍽'}</Text>
        </Animated.View>

        {/* Buttons */}
        <Animated.View
          style={[styles.buttons, { opacity: buttonsOpacity, transform: [{ translateY: buttonsTranslate }] }]}
        >
          <TouchableOpacity onPress={handleStart} activeOpacity={0.85} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>เริ่มเลย — ฟรี! →</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleLogin} activeOpacity={0.85} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>มี account แล้ว</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Pagination dots */}
        <View style={styles.dotsRow}>
          <View style={[styles.dot, styles.dotActive]} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  bg: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 40,
    gap: 28,
  },

  // Logo card
  logoCard: {
    alignItems: 'center',
  },
  bearImage: { width: 160, height: 160 },
  logoText: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
  logoOrange: { color: '#E07B39' },
  logoDark: { color: '#2D5A1B' },
  logoSub: { fontSize: 11, color: '#888', letterSpacing: 2.5, marginTop: 2 },

  // Greeting
  greetingWrap: { alignItems: 'center', gap: 6 },
  greetingTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#31332f',
    textAlign: 'center',
    lineHeight: 48,
  },
  greetingSub: { fontSize: 16, color: '#5e605b', textAlign: 'center' },

  // Buttons
  buttons: { gap: 12, width: '100%' },
  primaryBtn: {
    height: 56,
    borderRadius: 9999,
    backgroundColor: '#2D5A1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#ffffff' },
  outlineBtn: {
    height: 52,
    borderRadius: 9999,
    backgroundColor: '#dcfcd9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineBtnText: { fontSize: 16, fontWeight: '600', color: '#4a664b' },

  // Dots
  dotsRow: { flexDirection: 'row', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#ceeecc' },
  dotActive: { width: 20, backgroundColor: '#4a664b' },
})
