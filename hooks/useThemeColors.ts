import { useMemo } from 'react'
import { colors, darkColors } from '../constants/colors'
import { useTheme } from '../contexts/ThemeContext'

export type ThemeColors = ReturnType<typeof useThemeColors>

export function useThemeColors() {
  const { isDark } = useTheme()
  return useMemo(() => {
    const theme = isDark ? darkColors : colors
    return {
      ...theme,
      isDark,
      card:        theme.surfaceContainerLowest,
      cardAlt:     theme.surfaceContainerLow,
      section:     theme.surfaceContainer,
      pressed:     theme.surfaceContainerHigh,
      brand:       theme.primary,
      brandLight:  theme.primaryContainer,
      success:     theme.tertiaryContainer,
      successText: theme.tertiary,
      text:        theme.onBackground,
      textMuted:   theme.onSurfaceVariant,
      textLight:   theme.outline,
    }
  }, [isDark])
}
