import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Image, ImageBackground, ActivityIndicator, Linking, Platform,
  RefreshControl, Animated, Modal, Dimensions,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import * as Location from 'expo-location'
import { Ionicons } from '@expo/vector-icons'
import MapView, { Marker } from 'react-native-maps'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const MAP_HEIGHT = 220

import { useThemeColors } from '../../hooks/useThemeColors'
import { loadPlan } from '../../lib/db'
import { DayPlan } from '../../types'
import NotificationSheet from '../../components/NotificationSheet'

interface Store {
  id: string
  name: string
  type: string
  lat: number
  lon: number
  distance?: number
}

function calcDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371000
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function formatDist(m: number) {
  return m >= 1000 ? `${(m / 1000).toFixed(1)} กม.` : `${m} ม.`
}

async function fetchNearbyStores(lat: number, lon: number): Promise<Store[]> {
  const query = `
    [out:json][timeout:15];
    (
      node["shop"~"supermarket|convenience|grocery|greengrocer|butcher|seafood|market"](around:3000,${lat},${lon});
    );
    out 40;
  `
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  const data = await res.json()
  return (data.elements ?? [])
    .filter((e: any) => e.tags?.name)
    .map((e: any) => ({
      id: String(e.id),
      name: e.tags.name,
      type: e.tags.shop ?? 'store',
      lat: e.lat,
      lon: e.lon,
      distance: calcDistance(lat, lon, e.lat, e.lon),
    }))
    .sort((a: Store, b: Store) => (a.distance ?? 0) - (b.distance ?? 0))
}

const SHOP_ICON: Record<string, string> = {
  supermarket: 'cart',
  convenience: 'storefront',
  grocery:     'basket',
  greengrocer: 'leaf',
  butcher:     'restaurant',
  seafood:     'fish',
  market:      'storefront',
}

const SHOP_BG: Record<string, string> = {
  supermarket: '#FDE8D4',
  convenience: '#F0EDE8',
  grocery:     '#FDE8D4',
  greengrocer: '#dcfcd9',
  butcher:     '#FDE8D4',
  seafood:     '#DBEAFE',
  market:      '#FDE8D4',
}

const SHOP_COLOR: Record<string, string> = {
  supermarket: '#C8722A',
  convenience: '#5C3D1E',
  grocery:     '#C8722A',
  greengrocer: '#4a664b',
  butcher:     '#C8722A',
  seafood:     '#2B6CB0',
  market:      '#C8722A',
}

const SHOP_TYPE_TH: Record<string, string> = {
  supermarket: 'ซูเปอร์มาร์เก็ต',
  convenience: 'ร้านสะดวกซื้อ',
  grocery:     'ร้านขายของชำ',
  greengrocer: 'ร้านผักผลไม้',
  butcher:     'ร้านเนื้อสัตว์',
  seafood:     'ร้านอาหารทะเล',
  market:      'ตลาด',
}

const DISTANCE_OPTIONS = [
  { label: '500ม.', value: 500 },
  { label: '1กม.',  value: 1000 },
  { label: '1.5กม.', value: 1500 },
  { label: '3กม.',  value: 3000 },
]

const CATEGORY_OPTIONS = [
  { label: 'ทั้งหมด', value: 'all',     icon: 'restaurant-outline' as const },
  { label: 'ใกล้สุด', value: 'nearest', icon: 'navigate-outline' as const },
  { label: 'สุขภาพ',  value: 'health',  icon: 'leaf-outline' as const },
  { label: 'ตลาด',    value: 'market',  icon: 'basket-outline' as const },
]

const HEALTH_TYPES = ['greengrocer', 'seafood']
const MARKET_TYPES = ['market', 'grocery']

// ─── Store logo via Clearbit (free, no key needed) ───────────────────────────

const BRAND_DOMAINS: [RegExp, string][] = [
  [/7.?eleven|เซเว่น/i,           '7-eleven.com'],
  [/lotus|โลตัส|tesco/i,          'lotuss.com'],
  [/big\s?c|บิ๊กซี/i,             'bigc.co.th'],
  [/tops/i,                        'tops.co.th'],
  [/makro|แมคโคร/i,               'makro.co.th'],
  [/foodland|ฟู้ดแลนด์/i,         'foodland.co.th'],
  [/villa\s?market/i,              'villamarket.com'],
  [/family\s?mart|แฟมิลี่/i,      'familymart.co.th'],
  [/lawson/i,                      'lawson108.com'],
  [/cj\s?express/i,               'cjexpress.co.th'],
  [/gourmet/i,                     'gourmetmarketthailand.com'],
  [/rimping|ริมปิ้ง/i,            'rimping.co.th'],
  [/watsons|วัตสัน/i,             'watsons.co.th'],
  [/maxvalu|แม็กซ์วาลู/i,        'maxvalu.co.th'],
  [/donki|don\s?quijote/i,         'donki.com'],
  [/robinson|โรบินสัน/i,          'robinson.co.th'],
  [/central\s?food/i,              'centralfoodretail.com'],
  [/spar/i,                        'spar.com'],
  [/foodwold|ฟู้ดเวิลด์/i,        'foodworld.co.th'],
  [/freshmart|เฟรชมาร์ท/i,       'freshmart.co.th'],
]

function getStoreLogo(name: string): string | null {
  for (const [pattern, domain] of BRAND_DOMAINS) {
    if (pattern.test(name)) {
      // Google Favicon API — ฟรี ไม่ต้อง key ทำงานได้เสมอ
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
    }
  }
  return null
}

// ─── Custom map marker ────────────────────────────────────────────────────────

function StoreMarker({ store, isActive, iconName, iconColor, iconBg, onPress }: {
  store: Store
  isActive: boolean
  iconName: string
  iconColor: string
  iconBg: string
  onPress: () => void
}) {
  const logoUrl = getStoreLogo(store.name)
  // tracksViewChanges must be true until the image finishes loading,
  // otherwise react-native-maps won't repaint the marker after the logo arrives.
  const [ready, setReady] = useState(!logoUrl)

  return (
    <Marker
      coordinate={{ latitude: store.lat, longitude: store.lon }}
      title={store.name}
      onPress={onPress}
      tracksViewChanges={!ready}
    >
      <View style={[markerStyles.bubble, isActive && markerStyles.bubbleActive]}>
        {logoUrl ? (
          <Image
            source={{ uri: logoUrl }}
            style={markerStyles.logo}
            resizeMode="contain"
            onLoad={() => setReady(true)}
            onError={() => setReady(true)}
          />
        ) : (
          <View style={[markerStyles.iconWrap, { backgroundColor: iconBg }]}>
            <Ionicons name={iconName as any} size={16} color={iconColor} />
          </View>
        )}
      </View>
      <View style={[markerStyles.tail, isActive && markerStyles.tailActive]} />
    </Marker>
  )
}

const markerStyles = StyleSheet.create({
  bubble: {
    width: 40, height: 40,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.2,
    shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 2, borderColor: '#fff',
  },
  bubbleActive: {
    borderColor: '#C8722A',
    shadowOpacity: 0.35,
  },
  logo: { width: 28, height: 28, borderRadius: 6 },
  iconWrap: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  tail: {
    width: 0, height: 0,
    alignSelf: 'center',
    borderLeftWidth: 5, borderRightWidth: 5, borderTopWidth: 7,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#fff',
    marginTop: -1,
  },
  tailActive: { borderTopColor: '#C8722A' },
})

// ─── Stagger-animated list item wrapper ──────────────────────────────────────

function AnimatedStoreItem({ index, children }: { index: number; children: React.ReactNode }) {
  const anim = useRef(new Animated.Value(0)).current
  useEffect(() => {
    Animated.timing(anim, {
      toValue: 1,
      duration: 300,
      delay: index * 70,
      useNativeDriver: true,
    }).start()
  }, [])
  return (
    <Animated.View style={{
      opacity: anim,
      transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
    }}>
      {children}
    </Animated.View>
  )
}

export default function StoresScreen() {
  const C = useThemeColors()
  const styles = makeStyles(C)
  const insets = useSafeAreaInsets()

  const smallMapRef = useRef<MapView>(null)
  const fullMapRef  = useRef<MapView>(null)

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null)
  const [stores, setStores]     = useState<Store[]>([])
  const [loading, setLoading]   = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError]       = useState('')
  const [selectedDist, setSelectedDist] = useState(1500)
  const [selectedCat, setSelectedCat]   = useState('all')
  const [selectedId, setSelectedId]     = useState<string | null>(null)
  const [todayPlan, setTodayPlan] = useState<DayPlan | null>(null)
  const [showNotif, setShowNotif] = useState(false)
  const [fullMap, setFullMap]     = useState(false)
  const [pinnedStore, setPinnedStore] = useState<Store | null>(null)

  const loadLocation = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync()
    if (status !== 'granted') {
      setError('ไม่ได้รับอนุญาตเข้าถึงตำแหน่ง')
      setLoading(false)
      return
    }
    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High })
    const { latitude: lat, longitude: lon } = loc.coords
    setLocation({ lat, lon })
    try {
      const results = await fetchNearbyStores(lat, lon)
      setStores(results)
    } catch {
      setError('ไม่สามารถโหลดร้านค้าได้')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadLocation()
    // Load today's plan for context badge
    loadPlan().then((plan) => {
      if (!plan) return
      const today = new Date().toISOString().split('T')[0]
      const dayPlan = plan.days.find((d) => d.date === today) ?? plan.days[0]
      setTodayPlan(dayPlan ?? null)
    })
  }, [])

  const onRefresh = async () => {
    setRefreshing(true)
    setError('')
    await loadLocation()
    setRefreshing(false)
  }

  const filteredStores = stores.filter((s) => {
    if ((s.distance ?? 0) > selectedDist) return false
    if (selectedCat === 'health')  return HEALTH_TYPES.includes(s.type)
    if (selectedCat === 'market')  return MARKET_TYPES.includes(s.type)
    return true
  })

  const animateToRegion = (mapRef: React.RefObject<MapView | null>, lat: number, lon: number, delta = 0.01) => {
    mapRef.current?.animateToRegion({ latitude: lat, longitude: lon, latitudeDelta: delta, longitudeDelta: delta }, 500)
  }

  const centerOnMe = () => {
    if (!location) return
    animateToRegion(smallMapRef, location.lat, location.lon, 0.01)
  }

  const navigateTo = (store: Store) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    const url = Platform.OS === 'ios'
      ? `maps://?daddr=${store.lat},${store.lon}&dirflg=d`
      : `geo:${store.lat},${store.lon}?q=${store.lat},${store.lon}`
    Linking.openURL(url)
  }

  const viewOnMap = (store: Store) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    Linking.openURL(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.name)}&query_place_id=${store.lat},${store.lon}`
    )
  }

  const selectStore = (store: Store) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    setSelectedId(store.id)
    animateToRegion(smallMapRef, store.lat, store.lon, 0.005)
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ImageBackground
        source={require('../../assets/images/BG.png')}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        imageStyle={{ opacity: 0.10 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image source={require('../../assets/images/iconlogo.png')} style={styles.headerLogo} resizeMode="contain" />
          <Text style={styles.headerTitle}>BuddyPlan</Text>
        </View>
        <TouchableOpacity style={styles.bellBtn} activeOpacity={0.8} onPress={() => setShowNotif(true)}>
          <Ionicons name="notifications-outline" size={20} color="#5C3D1E" />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#C8722A"
            colors={['#C8722A']}
          />
        }
      >

        {/* Map */}
        <View style={styles.mapWrap}>
          {location ? (
            <MapView
              ref={smallMapRef}
              style={styles.map}
              initialRegion={{
                latitude: location.lat,
                longitude: location.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {filteredStores.map((store) => (
                <StoreMarker
                  key={store.id}
                  store={store}
                  isActive={selectedId === store.id}
                  iconName={SHOP_ICON[store.type] ?? 'storefront'}
                  iconColor={SHOP_COLOR[store.type] ?? '#C8722A'}
                  iconBg={SHOP_BG[store.type] ?? '#FDE8D4'}
                  onPress={() => selectStore(store)}
                />
              ))}
            </MapView>
          ) : (
            <View style={styles.mapPlaceholder}>
              {loading
                ? <ActivityIndicator color="#C8722A" />
                : <Text style={styles.errorText}>{error || 'กำลังโหลดแผนที่...'}</Text>
              }
            </View>
          )}

          {/* Locate-me button */}
          <TouchableOpacity style={styles.locateBtn} onPress={centerOnMe} activeOpacity={0.85}>
            <Ionicons name="locate" size={20} color="#5C3D1E" />
          </TouchableOpacity>

          {/* Expand button */}
          {location && (
            <TouchableOpacity
              style={styles.expandBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setFullMap(true) }}
              activeOpacity={0.85}
            >
              <Ionicons name="expand" size={18} color="#5C3D1E" />
            </TouchableOpacity>
          )}
        </View>

        {/* Today's meal context badge */}
        {todayPlan && (
          <View style={styles.mealBadge}>
            <Ionicons name="calendar-outline" size={15} color="#C8722A" />
            <Text style={styles.mealBadgeText} numberOfLines={1}>
              วันนี้: {todayPlan.breakfast.name} · {todayPlan.lunch.name} · {todayPlan.dinner.name}
            </Text>
          </View>
        )}

        {/* Title + count */}
        <View style={styles.titleRow}>
          <Text style={styles.heading}>ร้านใกล้ฉัน</Text>
          {!loading && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredStores.length}</Text>
            </View>
          )}
        </View>

        {/* Buddy tip */}
        {!loading && filteredStores.length > 0 && (
          <View style={styles.buddyTip}>
            <View style={styles.buddyIcon}>
              <Ionicons name="sparkles" size={16} color="#4a664b" />
            </View>
            <Text style={styles.buddyText}>
              Buddy พบร้านค้าใกล้คุณ {filteredStores.length} ร้านในรัศมี {formatDist(selectedDist)}
            </Text>
          </View>
        )}

        {/* Distance chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {DISTANCE_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.distChip, selectedDist === opt.value && styles.distChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedDist(opt.value) }}
              activeOpacity={0.8}
            >
              <Text style={[styles.distChipText, selectedDist === opt.value && styles.distChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Category chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipsRow}>
          {CATEGORY_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.catChip, selectedCat === opt.value && styles.catChipActive]}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedCat(opt.value) }}
              activeOpacity={0.8}
            >
              <Ionicons
                name={opt.icon}
                size={14}
                color={selectedCat === opt.value ? '#5C3D1E' : '#888'}
              />
              <Text style={[styles.catChipText, selectedCat === opt.value && styles.catChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Store cards */}
        {loading && stores.length === 0 ? (
          <View style={styles.loadingWrap}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.loadingBuddy}
              resizeMode="contain"
            />
            <Text style={styles.loadingText}>กำลังค้นหาร้านค้าใกล้เคียง...</Text>
            <ActivityIndicator color="#C8722A" style={{ marginTop: 8 }} />
          </View>
        ) : error && filteredStores.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.loadingBuddy}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>{error || 'ไม่พบร้านค้าในรัศมีที่เลือก'}</Text>
          </View>
        ) : filteredStores.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Image
              source={require('../../assets/images/logo.png')}
              style={styles.loadingBuddy}
              resizeMode="contain"
            />
            <Text style={styles.emptyText}>ไม่พบร้านค้าในรัศมีที่เลือก</Text>
          </View>
        ) : (
          filteredStores.map((store, index) => {
            const iconBg    = SHOP_BG[store.type]    ?? '#FDE8D4'
            const iconColor = SHOP_COLOR[store.type] ?? '#C8722A'
            const iconName  = (SHOP_ICON[store.type] ?? 'storefront') as any
            const typeTh    = SHOP_TYPE_TH[store.type] ?? store.type
            const isActive  = selectedId === store.id
            return (
              <AnimatedStoreItem key={store.id} index={index}>
                <TouchableOpacity
                  style={[styles.storeCard, isActive && styles.storeCardActive]}
                  onPress={() => selectStore(store)}
                  activeOpacity={0.92}
                >
                  {/* Photo area */}
                  <View style={[styles.cardPhoto, { backgroundColor: iconBg }]}>
                    {getStoreLogo(store.name) ? (
                      <Image
                        source={{ uri: getStoreLogo(store.name)! }}
                        style={styles.cardLogo}
                        resizeMode="contain"
                      />
                    ) : (
                      <Ionicons name={iconName} size={52} color={iconColor} />
                    )}
                    <View style={styles.distBadge}>
                      <Ionicons name="navigate" size={10} color="#fff" />
                      <Text style={styles.distBadgeText}>{formatDist(store.distance ?? 0)}</Text>
                    </View>
                  </View>

                  {/* Info */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardNameRow}>
                      <Text style={styles.cardName} numberOfLines={1}>{store.name}</Text>
                      <View style={[styles.typeBadge, { backgroundColor: iconBg }]}>
                        <Text style={[styles.typeBadgeText, { color: iconColor }]}>{typeTh}</Text>
                      </View>
                    </View>

                    {/* Action buttons */}
                    <View style={styles.cardActions}>
                      <TouchableOpacity
                        style={styles.navBtn}
                        onPress={() => navigateTo(store)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="navigate" size={14} color="#fff" />
                        <Text style={styles.navBtnText}>นำทาง</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.reviewBtn}
                        onPress={() => viewOnMap(store)}
                        activeOpacity={0.85}
                      >
                        <Ionicons name="map-outline" size={14} color="#5C3D1E" />
                        <Text style={styles.reviewBtnText}>ดูบนแผนที่</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedStoreItem>
            )
          })
        )}

      </ScrollView>

      <NotificationSheet visible={showNotif} onClose={() => setShowNotif(false)} />

      {/* Full-screen map modal */}
      <Modal visible={fullMap} animationType="slide" statusBarTranslucent>
        <View style={styles.fullMapContainer}>
          {location && (
            <MapView
              ref={fullMapRef}
              style={StyleSheet.absoluteFill}
              initialRegion={{
                latitude: location.lat,
                longitude: location.lon,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
              }}
              showsUserLocation
              showsMyLocationButton={false}
            >
              {filteredStores.map((store) => (
                <StoreMarker
                  key={store.id}
                  store={store}
                  isActive={pinnedStore?.id === store.id}
                  iconName={SHOP_ICON[store.type] ?? 'storefront'}
                  iconColor={SHOP_COLOR[store.type] ?? '#C8722A'}
                  iconBg={SHOP_BG[store.type] ?? '#FDE8D4'}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    setPinnedStore(store)
                    animateToRegion(fullMapRef, store.lat, store.lon, 0.005)
                  }}
                />
              ))}
            </MapView>
          )}

          {/* Close button */}
          <TouchableOpacity
            style={[styles.fullMapClose, { top: insets.top + 12 }]}
            onPress={() => { setFullMap(false); setPinnedStore(null) }}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={20} color="#5C3D1E" />
          </TouchableOpacity>

          {/* Center-me button */}
          <TouchableOpacity
            style={[styles.fullMapLocate, { bottom: pinnedStore ? 220 : insets.bottom + 24 }]}
            onPress={() => {
              if (!location) return
              animateToRegion(fullMapRef, location.lat, location.lon, 0.01)
            }}
            activeOpacity={0.85}
          >
            <Ionicons name="locate" size={20} color="#5C3D1E" />
          </TouchableOpacity>

          {/* Pinned store bottom sheet */}
          {pinnedStore && (
            <View style={[styles.pinSheet, { paddingBottom: insets.bottom + 16 }]}>
              <View style={styles.pinSheetHandle} />
              <View style={styles.pinSheetRow}>
                <View style={[styles.pinSheetIcon, { backgroundColor: SHOP_BG[pinnedStore.type] ?? '#FDE8D4' }]}>
                  <Ionicons
                    name={(SHOP_ICON[pinnedStore.type] ?? 'storefront') as any}
                    size={24}
                    color={SHOP_COLOR[pinnedStore.type] ?? '#C8722A'}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.pinSheetName} numberOfLines={1}>{pinnedStore.name}</Text>
                  <Text style={styles.pinSheetType}>
                    {SHOP_TYPE_TH[pinnedStore.type] ?? pinnedStore.type} · {formatDist(pinnedStore.distance ?? 0)}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setPinnedStore(null)} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={22} color="#ccc" />
                </TouchableOpacity>
              </View>
              <View style={styles.pinSheetActions}>
                <TouchableOpacity style={styles.navBtn} onPress={() => navigateTo(pinnedStore)} activeOpacity={0.85}>
                  <Ionicons name="navigate" size={16} color="#fff" />
                  <Text style={styles.navBtnText}>นำทาง</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reviewBtn} onPress={() => viewOnMap(pinnedStore)} activeOpacity={0.85}>
                  <Ionicons name="map-outline" size={16} color="#5C3D1E" />
                  <Text style={styles.reviewBtnText}>Google Maps</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  )
}

type Theme = ReturnType<typeof useThemeColors>

function makeStyles(C: Theme) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: C.background },
    scroll: { paddingBottom: 48, gap: 14 },

    // Header
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    headerLogo: { width: 36, height: 36, borderRadius: 10 },
    headerTitle: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 18, color: '#5C3D1E' },
    bellBtn: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: C.surfaceContainerLow, alignItems: 'center', justifyContent: 'center',
    },

    // Map
    mapWrap: { marginHorizontal: 20, borderRadius: 20, overflow: 'hidden', height: MAP_HEIGHT },
    map: { width: SCREEN_WIDTH - 40, height: MAP_HEIGHT },
    mapPlaceholder: {
      flex: 1, backgroundColor: C.surfaceContainerLow,
      alignItems: 'center', justifyContent: 'center',
    },
    locateBtn: {
      position: 'absolute', bottom: 12, right: 12,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 4,
    },
    expandBtn: {
      position: 'absolute', bottom: 12, left: 12,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 4,
    },

    // Full-screen map modal
    fullMapContainer: { flex: 1, backgroundColor: '#000' },
    fullMapClose: {
      position: 'absolute', left: 16,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 5,
    },
    fullMapLocate: {
      position: 'absolute', right: 16,
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6,
      shadowOffset: { width: 0, height: 2 }, elevation: 5,
    },

    // Pin bottom sheet
    pinSheet: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: '#fff',
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingHorizontal: 20, paddingTop: 12, gap: 14,
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 }, elevation: 10,
    },
    pinSheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: '#E0E0E0', alignSelf: 'center', marginBottom: 4,
    },
    pinSheetRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pinSheetIcon: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    pinSheetName: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: '#1C1A18',
    },
    pinSheetType: {
      fontFamily: 'PlusJakartaSans_400Regular', fontSize: 13, color: '#888',
      marginTop: 2,
    },
    pinSheetActions: { flexDirection: 'row', gap: 10 },

    // My location pin
    myPin: {
      width: 22, height: 22, borderRadius: 11,
      backgroundColor: 'rgba(200,114,42,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    myPinInner: {
      width: 11, height: 11, borderRadius: 6,
      backgroundColor: '#C8722A', borderWidth: 2, borderColor: '#fff',
    },

    // Store pin
    storePin: {
      width: 28, height: 28, borderRadius: 14,
      backgroundColor: '#fff',
      alignItems: 'center', justifyContent: 'center',
      shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 }, elevation: 3,
      borderWidth: 1.5, borderColor: '#FDE8D4',
    },
    storePinActive: { backgroundColor: '#C8722A', borderColor: '#C8722A' },

    // Today's meal badge
    mealBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      marginHorizontal: 20,
      backgroundColor: '#FDE8D4',
      borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10,
    },
    mealBadgeText: {
      flex: 1,
      fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 12, color: '#5C3D1E',
    },

    // Title row
    titleRow: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 20,
    },
    heading: { fontFamily: 'PlusJakartaSans_800ExtraBold', fontSize: 28, color: C.text },
    countBadge: {
      backgroundColor: '#C8722A', borderRadius: 999,
      paddingHorizontal: 10, paddingVertical: 3,
    },
    countBadgeText: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 13, color: '#fff',
    },

    // Buddy tip
    buddyTip: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      backgroundColor: '#dcfcd9',
      marginHorizontal: 20, borderRadius: 14, padding: 14,
    },
    buddyIcon: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: '#b7f5b0',
      alignItems: 'center', justifyContent: 'center',
    },
    buddyText: {
      flex: 1,
      fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#2d5a2e',
      lineHeight: 19,
    },

    // Chips
    chipsRow: { paddingHorizontal: 20, gap: 8 },

    distChip: {
      paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999,
      backgroundColor: C.surfaceContainerLow,
    },
    distChipActive: { backgroundColor: '#5C3D1E' },
    distChipText: {
      fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: C.textMuted,
    },
    distChipTextActive: { color: '#fff' },

    catChip: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999,
      backgroundColor: C.surfaceContainerLow,
    },
    catChipActive: { backgroundColor: '#FDE8D4' },
    catChipText: {
      fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 13, color: '#888',
    },
    catChipTextActive: { color: '#5C3D1E' },

    // Loading / empty
    loadingWrap: { alignItems: 'center', gap: 8, paddingTop: 24 },
    loadingBuddy: { width: 80, height: 80 },
    loadingText: { fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 14, color: C.textMuted },
    emptyWrap: { alignItems: 'center', gap: 10, paddingTop: 24 },
    emptyText: {
      fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14,
      color: C.textMuted, textAlign: 'center',
    },
    errorText: { fontFamily: 'PlusJakartaSans_400Regular', fontSize: 14, color: C.textMuted },

    // Store card
    storeCard: {
      marginHorizontal: 20,
      backgroundColor: C.surfaceContainerLowest,
      borderRadius: 20, overflow: 'hidden',
      borderWidth: 1.5, borderColor: 'transparent',
      shadowColor: '#000', shadowOpacity: 0.06,
      shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 2,
    },
    storeCardActive: { borderColor: '#C8722A' },

    cardPhoto: {
      height: 150,
      alignItems: 'center', justifyContent: 'center',
    },
    cardLogo: {
      width: 96, height: 96, borderRadius: 20,
    },
    distBadge: {
      position: 'absolute', top: 12, right: 12,
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(0,0,0,0.55)',
      paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999,
    },
    distBadgeText: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 12, color: '#fff',
    },

    cardBody: { padding: 14, gap: 12 },
    cardNameRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
    },
    cardName: {
      flex: 1,
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 16, color: C.text,
    },
    typeBadge: {
      paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999,
    },
    typeBadgeText: {
      fontFamily: 'PlusJakartaSans_600SemiBold', fontSize: 11,
    },

    cardActions: { flexDirection: 'row', gap: 10 },
    navBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: '#5C3D1E',
      paddingVertical: 11, borderRadius: 999,
    },
    navBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#fff',
    },
    reviewBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
      backgroundColor: C.surfaceContainerLow,
      paddingVertical: 11, borderRadius: 999,
    },
    reviewBtnText: {
      fontFamily: 'PlusJakartaSans_700Bold', fontSize: 14, color: '#5C3D1E',
    },
  })
}
