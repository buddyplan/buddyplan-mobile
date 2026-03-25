import React, { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, KeyboardAvoidingView, Platform, Image, ImageBackground,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { Ionicons } from '@expo/vector-icons'
import { signUp } from '../../lib/auth'

const GREEN = '#3D7A44'
const BG = '#F6F1E8'
const INPUT_BG = '#EDE8DC'
const DARK = '#1C1A18'
const MUTED = '#9E9890'
const PLACEHOLDER = '#B5AEA6'

export default function RegisterScreen() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) return
    if (password !== confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน')
      return
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setLoading(true)
    setError(null)
    try {
      await signUp(email, password, name)
      router.replace('/onboarding/goal')
    } catch (e: any) {
      setError(e.message ?? 'สมัครสมาชิกไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

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
            <Text style={s.topTitle}>สร้างบัญชี</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* Mascot */}
          <Image
            source={require('../../assets/images/register.png')}
            style={s.mascot}
            resizeMode="contain"
          />

          {/* Form */}
          <View style={s.form}>
            <View style={s.field}>
              <Text style={s.label}>ชื่อ</Text>
              <TextInput
                style={s.input}
                placeholder="ระบุชื่อของคุณ"
                placeholderTextColor={PLACEHOLDER}
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Email</Text>
              <TextInput
                style={s.input}
                placeholder="example@buddy.com"
                placeholderTextColor={PLACEHOLDER}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>

            <View style={s.field}>
              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={PLACEHOLDER}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={s.field}>
              <Text style={s.label}>Confirm Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={s.passwordInput}
                  placeholder="••••••••"
                  placeholderTextColor={PLACEHOLDER}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  autoCapitalize="none"
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirm(v => !v)} style={s.eyeBtn} activeOpacity={0.7}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={MUTED} />
                </TouchableOpacity>
              </View>
            </View>

            {error ? <Text style={s.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[s.btn, loading && { opacity: 0.65 }]}
              onPress={handleSignUp}
              activeOpacity={0.85}
              disabled={loading}
            >
              <Text style={s.btnText}>{loading ? 'กำลังสมัคร...' : 'สร้างบัญชี'}</Text>
            </TouchableOpacity>
          </View>

          {/* Login link */}
          <View style={s.bottomRow}>
            <Text style={s.bottomText}>มีบัญชีแล้ว? </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/login')} activeOpacity={0.7}>
              <Text style={s.bottomLink}>เข้าสู่ระบบ</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  scroll: { paddingHorizontal: 24, paddingTop: 8, paddingBottom: 48, gap: 18 },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 17, color: DARK },

  mascot: { width: 140, height: 140, alignSelf: 'center' },

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

  bottomRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  bottomText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: MUTED },
  bottomLink: { fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: GREEN },
})
