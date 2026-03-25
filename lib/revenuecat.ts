/**
 * revenuecat.ts
 * Wrapper around react-native-purchases for BuddyPlan premium subscriptions.
 *
 * Setup steps (one-time):
 *  1. Create a RevenueCat project at app.revenuecat.com
 *  2. Add API keys to app.json under the react-native-purchases plugin
 *  3. Create a Product in App Store Connect / Google Play Console:
 *       - Product ID: "buddyplan_premium_monthly"
 *       - Price: ฿99/month
 *  4. In RevenueCat dashboard:
 *       - Create an Entitlement named "premium"
 *       - Create an Offering named "default" with the product above
 */
import Purchases, {
  PurchasesPackage,
  CustomerInfo,
  LOG_LEVEL,
} from 'react-native-purchases'
import { Platform } from 'react-native'

export const ENTITLEMENT_ID = 'premium'

// ─── Init ─────────────────────────────────────────────────────────────────────

export async function initRevenueCat(userId?: string): Promise<void> {
  if (__DEV__) {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG)
  }

  const apiKey =
    Platform.OS === 'ios'
      ? process.env.EXPO_PUBLIC_RC_IOS_KEY ?? ''
      : process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? ''

  Purchases.configure({ apiKey })

  if (userId) {
    await Purchases.logIn(userId)
  }
}

// ─── Offerings ────────────────────────────────────────────────────────────────

/** Returns the premium monthly package, or null if not available. */
export async function getPremiumPackage(): Promise<PurchasesPackage | null> {
  try {
    const offerings = await Purchases.getOfferings()
    const current = offerings.current
    if (!current) return null
    return current.monthly ?? current.availablePackages[0] ?? null
  } catch {
    return null
  }
}

// ─── Purchase ─────────────────────────────────────────────────────────────────

export type PurchaseResult =
  | { success: true; customerInfo: CustomerInfo }
  | { success: false; cancelled: boolean; error: string }

export async function purchasePremium(pkg: PurchasesPackage): Promise<PurchaseResult> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg)
    return { success: true, customerInfo }
  } catch (e: any) {
    if (e.userCancelled) {
      return { success: false, cancelled: true, error: 'cancelled' }
    }
    return { success: false, cancelled: false, error: e.message ?? 'Purchase failed' }
  }
}

// ─── Restore ──────────────────────────────────────────────────────────────────

export async function restorePurchases(): Promise<PurchaseResult> {
  try {
    const customerInfo = await Purchases.restorePurchases()
    return { success: true, customerInfo }
  } catch (e: any) {
    return { success: false, cancelled: false, error: e.message ?? 'Restore failed' }
  }
}

// ─── Entitlement check ────────────────────────────────────────────────────────

/** Returns true if the user currently has an active premium entitlement. */
export async function isPremiumActive(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo()
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined
  } catch {
    return false
  }
}
