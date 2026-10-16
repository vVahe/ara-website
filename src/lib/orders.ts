import { randomBytes } from "crypto";
import { isShipCountry, shippingCents, type ShipCountry } from "@/config/shipping";
import { products, type Product } from "@/lib/content";

const limits = {
  name: 80,
  email: 120,
  street: 120,
  postalCode: 16,
  city: 80,
};

export type CheckoutInput = {
  product: Product;
  size: string;
  quantity: number;
  country: ShipCountry;
  shippingCents: number;
  totalCents: number;
  name: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
};

export function newOrderId() {
  return `ord_${randomBytes(9).toString("base64url")}`;
}

function text(value: unknown, max: number) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

export function parseCheckout(body: unknown): CheckoutInput | string {
  if (!body || typeof body !== "object") return "Check the form and try again.";
  const input = body as Record<string, unknown>;

  const product = products.find((item) => item.id === input.productId);
  if (!product || product.currency !== "EUR" || !Number.isInteger(product.priceCents)) {
    return "Choose a product.";
  }

  let size = "";
  if (product.sizes.length > 0) {
    if (typeof input.size !== "string" || !product.sizes.includes(input.size)) {
      return "Choose a size.";
    }
    size = input.size;
  } else if (input.size !== undefined && input.size !== "") {
    return "Choose a product.";
  }

  if (!Number.isInteger(input.quantity) || (input.quantity as number) < 1 || (input.quantity as number) > 3) {
    return "Quantity must be 1, 2, or 3.";
  }
  const quantity = input.quantity as number;

  const name = text(input.name, limits.name);
  if (!name) return "Enter your name.";

  const email = text(input.email, limits.email);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email.";

  const street = text(input.street, limits.street);
  if (!street) return "Enter your street and number.";

  const postalCode = text(input.postalCode, limits.postalCode);
  if (!postalCode) return "Enter your postal code.";

  const city = text(input.city, limits.city);
  if (!city) return "Enter your city.";

  if (typeof input.country !== "string" || !isShipCountry(input.country)) {
    return "Choose a country.";
  }

  const postage = shippingCents(input.country, product.shippingClass);
  return {
    product,
    size,
    quantity,
    country: input.country,
    shippingCents: postage,
    totalCents: product.priceCents * quantity + postage,
    name,
    email,
    street,
    postalCode,
    city,
  };
}
