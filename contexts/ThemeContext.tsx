import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { saveTheme, loadTheme } from '../lib/db'

const THEME_KEY = '@buddyplan_theme'

interface ThemeContextValue {
  isDark: boolean
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  isDark: false,
  toggleTheme: () => {},
})

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme()
  const [isDark, setIsDark] = useState<boolean>(systemScheme === 'dark')
  const [loaded, setLoaded] = useState(false)

  // Load saved preference on mount — try Supabase first, fallback to AsyncStorage
  useEffect(() => {
    loadTheme().then((saved) => {
      if (saved !== null) {
        setIsDark(saved === 'dark')
      } else {
        setIsDark(systemScheme === 'dark')
      }
      setLoaded(true)
    })
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    saveTheme(next ? 'dark' : 'light')
  }

  if (!loaded) return null

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  return useContext(ThemeContext)
}
