import { site } from "@/config/site";
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

export async function createPayment(orderId: string, input: CheckoutInput) {
  const key = apiKey();
  if (!key) return { error: "Payments are not configured." as const };

  const origin = siteOrigin();
  const description = input.size
    ? `${site.shortName} — ${input.product.title} / ${input.size}`
    : `${site.shortName} — ${input.product.title}`;

  const payload: Record<string, unknown> = {
    amount: { currency: "EUR", value: euros(input.totalCents) },
    description,
    redirectUrl: `${origin}/shop/thank-you?order=${orderId}`,
    cancelUrl: `${origin}/shop/cancelled`,
    metadata: {
      orderId,
      productId: input.product.id,
      title: input.product.title,
      size: input.size,
      quantity: String(input.quantity),
      shippingCents: String(input.shippingCents),
      totalCents: String(input.totalCents),
      shippingClass: input.product.shippingClass,
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
    metadata?: unknown;
  };

  if (payment.status !== "paid") return "ignore";

  const quantity = Number(metaString(payment.metadata, "quantity"));
  const shippingCents = Number(metaString(payment.metadata, "shippingCents"));
  const totalCents = Number(metaString(payment.metadata, "totalCents"));
  const orderId = metaString(payment.metadata, "orderId");
  const title = metaString(payment.metadata, "title");
  const email = metaString(payment.metadata, "email");
  const name = metaString(payment.metadata, "name");
  const street = metaString(payment.metadata, "street");
  const postalCode = metaString(payment.metadata, "postalCode");
  const city = metaString(payment.metadata, "city");
  const country = metaString(payment.metadata, "country");
  const shippingClass = metaString(payment.metadata, "shippingClass");

  if (
    !payment.id ||
    !payment.paidAt ||
    !orderId ||
    !title ||
    !email ||
    !name ||
    !street ||
    !postalCode ||
    !city ||
    !country ||
    !shippingClass ||
    !Number.isInteger(quantity) ||
    !Number.isInteger(shippingCents) ||
    !Number.isInteger(totalCents)
  ) {
    console.error("paid mollie payment missing order metadata", payment.id);
    return "retry";
  }

  return {
    paymentId: payment.id,
    paidAt: payment.paidAt,
    orderId,
    productId: metaString(payment.metadata, "productId") ?? "",
    title,
    size: metaString(payment.metadata, "size") ?? "",
    quantity,
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
