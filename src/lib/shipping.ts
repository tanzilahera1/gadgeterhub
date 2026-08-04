// src/lib/shipping.ts

export type DeliveryZone = "dhaka" | "suburbs" | "outside";

export interface ZoneDetail {
  key: DeliveryZone;
  label: string;
  badgeLabel: string;
  subtitle: string;
}

export const DELIVERY_ZONES: Record<DeliveryZone, ZoneDetail> = {
  dhaka: {
    key: "dhaka",
    label: "ISD (Inside Dhaka)",
    badgeLabel: "ISD (Inside Dhaka)",
    subtitle: "ঢাকার শহর ও মূল এলাকা",
  },
  suburbs: {
    key: "suburbs",
    label: "SUB (Suburbs)",
    badgeLabel: "SUB (Suburbs)",
    subtitle: "গাজীপুর, সাভার, নারায়নগঞ্জ, কেরানীগঞ্জ",
  },
  outside: {
    key: "outside",
    label: "OSD (Outside Dhaka)",
    badgeLabel: "OSD (Outside Dhaka)",
    subtitle: "ঢাকার বাইরে সকল জেলা ও উপজেলা",
  },
};

export const DEFAULT_PRODUCT_WEIGHT_GRAMS = 500;

/**
 * Calculates delivery charge based on delivery zone and total weight in grams.
 *
 * Matrix:
 * - Dhaka:   0-500g → ৳60  | 500g-1kg → ৳70  | 1kg-2kg → ৳90  | >2kg → +৳20/kg
 * - Suburbs: 0-500g → ৳80  | 500g-1kg → ৳100 | 1kg-2kg → ৳130 | >2kg → +৳30/kg
 * - Outside: see PATHAO PRICING MODE below
 *
 * ============================================================
 * PATHAO PRICING MODE — Switch comment when changing mode
 * ============================================================
 *
 * [MODE A] Pathao ONLINE / Negotiated Rate:
 *   0-500g → ৳110  |  500g-1kg → ৳130  |  1kg-2kg → ৳170
 *
 * [MODE B] Pathao OFFLINE Standard (hub drop-off min ৳130):
 *   All weights → ৳130 (Pathao offline default)
 *
 * CURRENT MODE: A (Online / Negotiated Rate — ৳110 for 0-500g)
 * ============================================================
 */
export function calculateShippingCost(
  zone: DeliveryZone = "dhaka",
  totalWeightGrams: number = DEFAULT_PRODUCT_WEIGHT_GRAMS,
): number {
  const weight = Math.max(1, totalWeightGrams);

  if (weight <= 500) {
    switch (zone) {
      case "dhaka":   return 60;
      case "suburbs": return 80;
      case "outside": return 110; // MODE A: ৳110 (Online / Negotiated rate)
    }
  } else if (weight <= 1000) {
    switch (zone) {
      case "dhaka":   return 70;
      case "suburbs": return 100;
      case "outside": return 130;
    }
  } else if (weight <= 2000) {
    switch (zone) {
      case "dhaka":   return 90;
      case "suburbs": return 130;
      case "outside": return 170;
    }
  } else {
    // Exceeds 2kg: Base 2kg rate + extra per additional kg
    const extraKg = Math.ceil((weight - 2000) / 1000);
    switch (zone) {
      case "dhaka":   return 90  + extraKg * 20;
      case "suburbs": return 130 + extraKg * 30;
      case "outside": return 170 + extraKg * 40;
    }
  }
}

/**
 * Gets human-readable weight tier string (e.g. "0-500g", "500g-1kg", "1kg-2kg", "2.5kg")
 */
export function getWeightTierLabel(totalWeightGrams: number): string {
  if (totalWeightGrams <= 500) return "0-500g";
  if (totalWeightGrams <= 1000) return "500g-1kg";
  if (totalWeightGrams <= 2000) return "1kg-2kg";
  return `${(totalWeightGrams / 1000).toFixed(1)}kg`;
}

export function getZoneBadgeInfo(shipping?: { deliveryArea?: DeliveryZone }, shippingCost?: number): { label: string; color: string } {
  const area = shipping?.deliveryArea;
  if (area === "suburbs") return { label: "SUB (Suburbs)", color: "purple" };
  if (area === "outside") return { label: "OSD (Outside Dhaka)", color: "orange" };
  if (area === "dhaka") return { label: "ISD (Inside Dhaka)", color: "geekblue" };

  // Fallback for legacy orders based on shippingCost
  if (shippingCost === 80 || shippingCost === 100) return { label: "SUB (Suburbs)", color: "purple" };
  if (shippingCost && shippingCost > 100) return { label: "OSD (Outside Dhaka)", color: "orange" };
  return { label: "ISD (Inside Dhaka)", color: "geekblue" };
}
