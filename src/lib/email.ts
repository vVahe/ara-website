import { formatEuros } from "@/lib/money";
import { lineLabel } from "@/lib/lines";
import type { PaidOrder } from "@/lib/mollie";

export async function sendMerchantEmail(order: PaidOrder) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = process.env.MERCHANT_ORDER_EMAIL?.trim();
  if (!key || !from || !to) {
    throw new Error("merchant email is not configured");
  }

  const items = order.lines.map(
    (line) => `${lineLabel(line)} × ${line.quantity} — ${formatEuros(line.unitCents * line.quantity)}`,
  );
  const text = [
    `Order ${order.orderId}`,
    ...items,
    `Shipping: ${formatEuros(order.shippingCents)} (${order.shippingClass})`,
    `Total: ${formatEuros(order.totalCents)}`,
    `Mollie: ${order.paymentId}`,
    "",
    order.name,
    order.email,
    order.street,
    `${order.postalCode} ${order.city}`,
    order.country,
  ].join("\n");

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Order ${order.orderId} — ${order.title}`,
      text,
      reply_to: order.email,
    }),
  });

  if (!response.ok) {
    throw new Error(`merchant email failed: ${response.status}`);
  }
}
