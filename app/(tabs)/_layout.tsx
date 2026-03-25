import { Tabs } from 'expo-router'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useThemeColors } from '../../hooks/useThemeColors'

type IoniconsName = React.ComponentProps<typeof Ionicons>['name']

const TABS: { name: string; label: string; icon: IoniconsName }[] = [
  { name: 'home',     label: 'Home',    icon: 'home'     },
  { name: 'shopping', label: 'List',    icon: 'basket'   },
  { name: 'stores',   label: 'Explore', icon: 'navigate' },
  { name: 'profile',  label: 'Profile', icon: 'person'   },
]

function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const C = useThemeColors()

  return (
    <View style={[styles.outerWrap, { paddingBottom: insets.bottom + 8 }]}>
      <View style={[styles.tabBar, { backgroundColor: C.surfaceContainerLowest }]}>
        {state.routes.map((route, index) => {
          const focused = state.index === index
          const tab = TABS[index]

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name)
            }
          }

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              style={styles.tabItem}
            >
              <View style={[
                styles.pill,
                focused && { backgroundColor: C.isDark ? C.primaryContainer : '#FDE8D4' },
              ]}>
                <Ionicons
                  name={focused ? tab.icon : (`${tab.icon}-outline` as IoniconsName)}
                  size={24}
                  color={focused ? (C.isDark ? C.onPrimaryContainer : '#5C3D1E') : C.textMuted}
                />
                <Text style={[
                  styles.label,
                  { color: C.textMuted },
                  focused && { color: C.isDark ? C.onPrimaryContainer : '#5C3D1E' },
                ]}>
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="home"     options={{ title: 'Home'    }} />
      <Tabs.Screen name="shopping" options={{ title: 'List'    }} />
      <Tabs.Screen name="stores"   options={{ title: 'Explore' }} />
      <Tabs.Screen name="profile"  options={{ title: 'Profile' }} />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  outerWrap: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabBar: {
    flexDirection: 'row',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
  pill: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  label: {
    fontFamily: 'PlusJakartaSans_600SemiBold',
    fontSize: 11,
  },
})
