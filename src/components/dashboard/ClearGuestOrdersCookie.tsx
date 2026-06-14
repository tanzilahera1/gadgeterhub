"use client";

import { useEffect } from "react";

export function ClearGuestOrdersCookie() {
  useEffect(() => {
    // Clear the guest_orders cookie on the client side
    document.cookie = "guest_orders=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax";
  }, []);

  return null;
}
