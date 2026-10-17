import { site } from "@/config/site";
import {
  decodeLines,
  encodeLines,
  goodsCents,
  lineLabel,
  orderQuantity,
  sheetTitle,
  type OrderLine,
} from "@/lib/lines";
import type { CheckoutInput } from "@/lib/orders";

const api = "https://api.mollie.com/v2/payments";

export type PaidOrder = {
  paymentId: string;
  paidAt: string;
  orderId: string;
  productId: string;
  title: string;
  size: string;
  quantity: number;
  lines: OrderLine[];
  shippingCents: number;
  totalCents: number;
  shippingClass: string;
  name: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  country: string;
};

function apiKey() {
  const key = process.env.MOLLIE_API_KEY?.trim();
  return key || null;
}

export function siteOrigin() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export function publicWebhookUrl(origin: string) {
  try {
    const url = new URL(origin);
    if (url.protocol !== "https:") return null;
    return `${origin}/api/mollie/webhook`;
  } catch {
    return null;
  }
}

function euros(cents: number) {
  return (cents / 100).toFixed(2);
}

function paymentDescription(input: CheckoutInput) {
  const summary = input.lines.map((line) => `${lineLabel(line)} × ${line.quantity}`).join(", ");
  const text = `${site.shortName} — ${summary}`;
  return text.length > 255 ? `${text.slice(0, 252)}...` : text;
}

export async function createPayment(orderId: string, input: CheckoutInput) {
  const key = apiKey();
  if (!key) return { error: "Payments are not configured." as const };

  const encoded = encodeLines(input.lines);
  if (!encoded) return { error: "Checkout could not start. Try again." as const };

  const origin = siteOrigin();
  const payload: Record<string, unknown> = {
    amount: { currency: "EUR", value: euros(input.totalCents) },
    description: paymentDescription(input),
    redirectUrl: `${origin}/shop/thank-you?order=${orderId}`,
    cancelUrl: `${origin}/shop/cancelled`,
    metadata: {
      orderId,
      lines: encoded,
      shippingCents: String(input.shippingCents),
      totalCents: String(input.totalCents),
      shippingClass: input.shippingClass,
      name: input.name,
      email: input.email,
      street: input.street,
      postalCode: input.postalCode,
      city: input.city,
      country: input.country,
    },
  };

  const webhookUrl = publicWebhookUrl(origin);
  if (webhookUrl) payload.webhookUrl = webhookUrl;

  const response = await fetch(api, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.error("mollie payment create failed", response.status);
    return { error: "Checkout could not start. Try again." as const };
  }

  const payment = (await response.json()) as {
    _links?: { checkout?: { href?: string } };
  };
  const checkoutUrl = payment._links?.checkout?.href;
  if (!checkoutUrl) {
    console.error("mollie payment create missing checkout url");
    return { error: "Checkout could not start. Try again." as const };
  }

  return { checkoutUrl };
}

function metaString(metadata: unknown, key: string) {
  if (!metadata || typeof metadata !== "object") return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" ? value : null;
}

function amountCents(amount: unknown) {
  if (!amount || typeof amount !== "object") return null;
  const record = amount as { currency?: unknown; value?: unknown };
  if (record.currency !== "EUR" || typeof record.value !== "string") return null;
  const match = /^(\d+)\.(\d{2})$/.exec(record.value);
  if (!match) return null;
  return Number(match[1]) * 100 + Number(match[2]);
}

function paidOrder(
  payment: { id: string; paidAt: string },
  metadata: unknown,
  lines: OrderLine[],
  shippingCents: number,
  totalCents: number,
): PaidOrder | "retry" {
  const orderId = metaString(metadata, "orderId");
  const email = metaString(metadata, "email");
  const name = metaString(metadata, "name");
  const street = metaString(metadata, "street");
  const postalCode = metaString(metadata, "postalCode");
  const city = metaString(metadata, "city");
  const country = metaString(metadata, "country");
  const shippingClass = metaString(metadata, "shippingClass");

  if (
    !orderId ||
    !email ||
    !name ||
    !street ||
    !postalCode ||
    !city ||
    !country ||
    !shippingClass ||
    lines.length < 1 ||
    goodsCents(lines) + shippingCents !== totalCents
  ) {
    console.error("paid mollie payment missing order metadata", payment.id);
    return "retry";
  }

  return {
    paymentId: payment.id,
    paidAt: payment.paidAt,
    orderId,
    productId: lines.map((line) => line.productId).join(","),
    title: sheetTitle(lines),
    size: lines.length === 1 ? lines[0].size : "",
    quantity: orderQuantity(lines),
    lines,
    shippingCents,
    totalCents,
    shippingClass,
    name,
    email,
    street,
    postalCode,
    city,
    country,
  };
}

export async function readPaidOrder(paymentId: string): Promise<PaidOrder | "ignore" | "retry"> {
  const key = apiKey();
  if (!key) {
    console.error("mollie webhook missing api key");
    return "retry";
  }

  const response = await fetch(`${api}/${paymentId}`, {
    headers: { Authorization: `Bearer ${key}` },
    cache: "no-store",
  });

  if (!response.ok) {
    console.error("mollie payment fetch failed", response.status);
    return "retry";
  }

  const payment = (await response.json()) as {
    id?: string;
    status?: string;
    paidAt?: string;
    amount?: unknown;
    metadata?: unknown;
  };

  if (payment.status !== "paid") return "ignore";
  if (!payment.id || !payment.paidAt) return "retry";

  const shippingCents = Number(metaString(payment.metadata, "shippingCents"));
  const totalCents = Number(metaString(payment.metadata, "totalCents"));
  if (!Number.isInteger(shippingCents) || !Number.isInteger(totalCents) || shippingCents < 0 || totalCents < 0) {
    console.error("paid mollie payment missing order metadata", payment.id);
    return "retry";
  }
  if (amountCents(payment.amount) !== totalCents) {
    console.error("paid mollie payment amount mismatch", payment.id);
    return "retry";
  }

  const encoded = metaString(payment.metadata, "lines");
  if (encoded) {
    const lines = decodeLines(encoded);
    if (!lines) {
      console.error("paid mollie payment missing order metadata", payment.id);
      return "retry";
    }
    return paidOrder(payment as { id: string; paidAt: string }, payment.metadata, lines, shippingCents, totalCents);
  }

  const quantity = Number(metaString(payment.metadata, "quantity"));
  const title = metaString(payment.metadata, "title");
  if (!title || !Number.isInteger(quantity) || quantity < 1 || quantity > 3) {
    console.error("paid mollie payment missing order metadata", payment.id);
    return "retry";
  }
  const goods = totalCents - shippingCents;
  if (goods < 0 || goods % quantity !== 0) {
    console.error("paid mollie payment missing order metadata", payment.id);
    return "retry";
  }
  const lines: OrderLine[] = [
    {
      productId: metaString(payment.metadata, "productId") ?? "",
      title,
      kind: "",
      size: metaString(payment.metadata, "size") ?? "",
      quantity,
      unitCents: goods / quantity,
    },
  ];
  return paidOrder(payment as { id: string; paidAt: string }, payment.metadata, lines, shippingCents, totalCents);
}
