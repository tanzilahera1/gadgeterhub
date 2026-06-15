// src\lib\delivery-charges.ts
export const DELIVERY_CHARGES = {
  dhaka: 70,
  outside: 130,
} as const;

export type DeliveryArea = keyof typeof DELIVERY_CHARGES;