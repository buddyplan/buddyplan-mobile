import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Image, ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import Svg, { Path } from 'react-native-svg'
import { signIn, signInWithProvider } from '../../lib/auth'
import { loadProfile, loadPlan } from '../../lib/db'

const GREEN = '#3D7A44'
const BG = '#F6F1E8'
const INPUT_BG = '#EDE8DC'
const DARK = '#1C1A18'
const MUTED = '#9E9890'
const PLACEHOLDER = '#B5AEA6'
const ORANGE = '#E08028'
const FB_BLUE = '#1877F2'
const APPLE_DARK = '#1C1C1E'

function GoogleIcon({ size = 22 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <Path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <Path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <Path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </Svg>
  )
}

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSignIn = async () => {
    if (!email || !password) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      const [profile, plan] = await Promise.all([loadProfile(), loadPlan()])
      if (!profile) router.replace('/onboarding/goal')
      else if (!plan) router.replace('/onboarding/splash')
      else router.replace('/(tabs)/home')
    } catch (e: any) {
      setError(e.message ?? 'เข้าสู่ระบบไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  const handleSocial = async (provider: 'google' | 'facebook' | 'apple') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSocialLoading(provider)
    setError(null)
    try {
      const session = await signInWithProvider(provider)
      if (session) {
        const profile = await loadProfile()
        router.replace(profile ? '/(tabs)/home' : '/onboarding/goal')
      }
    } catch (e: any) {
      setError(e.message ?? 'เข้าสู่ระบบด้วย Social ไม่สำเร็จ')
    } finally {
      setSocialLoading(null)
    }
  }

  const isDisabled = loading || !!socialLoading

  return (
    <SafeAreaView style={s.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.07 }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Top bar */}
          <View style={s.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="arrow-back" size={20} color={DARK} />
            </TouchableOpacity>
            <Text style={s.topTitle}>เข้าสู่ระบบ</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Logo */}
          <View style={s.logoWrap}>
            <Image
              source={require('../../assets/images/iconlogo.png')}
              style={s.logo}
              resizeMode="cover"
            />
          </View>

          {/* Subtitle */}
          <Text style={s.subtitle}>ยินดีต้องรับกลับมา!{'\n'}เริ่มต้นวางแผนมื้ออาหารกัน</Text>

          {/* Form */}
          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>อีเมล</Text>
              <TextInput
                style={s.input}
                placeholder="Email"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isDisabled}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>รหัสผ่าน</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="Password"
                  placeholderTextColor={PLACEHOLDER}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!isDisabled}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={s.forgotWrap} activeOpacity={0.7}>
                <Text style={s.forgotText}>ลืมรหัส?</Text>
              </TouchableOpacity>
            </View>

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.btn, isDisabled && { opacity: 0.65 }]}
              onPress={handleSignIn}
              activeOpacity={0.85}
              disabled={isDisabled}
            >
              <Text style={s.btnText}>{loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}</Text>
            </TouchableOpacity>
          </View>

          {/* Divider */}
          <Text style={s.orText}>หรือ</Text>

          {/* Social buttons */}
          <View style={s.socialRow}>
            <TouchableOpacity
              style={[s.socialCircle, { backgroundColor: FB_BLUE }, socialLoading === 'facebook' && { opacity: 0.6 }]}
              onPress={() => handleSocial('facebook')}
              activeOpacity={0.85}
              disabled={isDisabled}
            >
              <Ionicons name="logo-facebook" size={26} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.socialCircle, { backgroundColor: '#fff' }, socialLoading === 'google' && { opacity: 0.6 }]}
              onPress={() => handleSocial('google')}
              activeOpacity={0.85}
              disabled={isDisabled}
            >
              <GoogleIcon size={24} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.socialCircle, { backgroundColor: APPLE_DARK }, socialLoading === 'apple' && { opacity: 0.6 }]}
              onPress={() => handleSocial('apple')}
              activeOpacity={0.85}
              disabled={isDisabled}
            >
              <Ionicons name="logo-apple" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Register link */}
          <View style={s.bottomRow}>
            <Text style={s.bottomText}>ยังไม่มีบัญชี? </Text>
            <TouchableOpacity onPress={() => router.push('/auth/register')} activeOpacity={0.7}>
              <Text style={s.bottomLink}>สมัครเลย</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, gap: 20 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: DARK },

  logoWrap: { alignSelf: 'center', borderRadius: 24, overflow: 'hidden', borderWidth: 2.5, borderColor: '#E8A050' },
  logo: { width: 120, height: 120 },

  subtitle: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 14, color: MUTED,
    textAlign: 'center', lineHeight: 22,
  },

  form: { gap: 14 },
  field: { gap: 8 },
  label: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: DARK },
  input: {
    height: 52, backgroundColor: INPUT_BG,
    borderRadius: 14, paddingHorizontal: 16,
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: DARK,
  },
  passwordWrap: {
    height: 52, backgroundColor: INPUT_BG,
    borderRadius: 14, paddingRight: 12,
    flexDirection: 'row', alignItems: 'center',
  },
  passwordInput: {
    flex: 1, paddingHorizontal: 16,
    fontFamily: 'PlusJakartaSans_400Regular', fontSize: 15, color: DARK,
  },
  eyeBtn: { padding: 8 },
  forgotWrap: { alignSelf: 'flex-end' },
  forgotText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: ORANGE },

  errorText: {
    fontFamily: 'PlusJakartaSans_400Regular',
    fontSize: 13, color: '#D32F2F', textAlign: 'center',
  },

  btn: {
    height: 56, borderRadius: 9999,
    backgroundColor: GREEN,
    alignItems: 'center', justifyContent: 'center',
    marginTop: 4,
  },
  btnText: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#fff' },

  orText: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 13, color: MUTED, textAlign: 'center',
  },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20 },
  socialCircle: {
    width: 60, height: 60, borderRadius: 30,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14, shadowRadius: 6, elevation: 4,
  },

  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 4 },
  bottomText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: MUTED },
  bottomLink: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: GREEN },
})
