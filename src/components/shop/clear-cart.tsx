"use client";

import { useEffect } from "react";
import { clearCart } from "@/lib/cart";

export function ClearCart({ orderId }: { orderId: string | null }) {
  useEffect(() => {
    if (!orderId) return;
    const key = `ara-cart-cleared:${orderId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
    clearCart();
  }, [orderId]);

  return null;
}
