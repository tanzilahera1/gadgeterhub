// src/lib/delivery-charges.ts
import { DeliveryZone, calculateShippingCost } from "./shipping";

export const DELIVERY_CHARGES: Record<DeliveryZone, number> = {
  dhaka: 60,
  suburbs: 80,
  outside: 110,
};

export type DeliveryArea = DeliveryZone;
export { calculateShippingCost };