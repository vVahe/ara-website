import type { PaidOrder } from "@/lib/mollie";

export async function appendOrder(order: PaidOrder) {
  const url = process.env.SHEET_WEBHOOK_URL?.trim();
  const secret = process.env.SHEET_WEBHOOK_SECRET?.trim();
  if (!url || !secret) {
    throw new Error("sheet webhook is not configured");
  }

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sheet-secret": secret,
    },
    body: JSON.stringify({
      orderId: order.orderId,
      paidAt: order.paidAt,
      molliePaymentId: order.paymentId,
      title: order.title,
      size: order.size,
      quantity: order.quantity,
      totalCents: order.totalCents,
      name: order.name,
      email: order.email,
      street: order.street,
      postalCode: order.postalCode,
      city: order.city,
      country: order.country,
      shippingClass: order.shippingClass,
    }),
  });

  if (!response.ok) {
    throw new Error(`sheet webhook failed: ${response.status}`);
  }

  const payload = (await response.json().catch(() => null)) as { duplicate?: boolean } | null;
  return { duplicate: payload?.duplicate === true };
}
