import { randomBytes } from "crypto";
import { copy } from "@/config/copy";
import { isShipCountry, shippingCents, type ShipCountry, type ShippingClass } from "@/config/shipping";
import { readAddress, type AddressErrors } from "@/lib/address";
import { products, type Product } from "@/lib/content";
import { encodeLines, shipmentClass, type OrderLine } from "@/lib/lines";

const maxLines = 6;

export type CheckoutInput = {
  lines: OrderLine[];
  shippingClass: ShippingClass;
  shippingCents: number;
  totalCents: number;
  name: string;
  email: string;
  street: string;
  postalCode: string;
  city: string;
  country: ShipCountry;
};

export type CheckoutRejection = {
  error: string;
  fields?: AddressErrors;
};

export function newOrderId() {
  return `ord_${randomBytes(9).toString("base64url")}`;
}

function lineSize(product: Product, value: unknown): string | null {
  if (product.sizes.length > 0) {
    if (typeof value !== "string" || !product.sizes.includes(value)) return null;
    return value;
  }
  if (value !== undefined && value !== "") return null;
  return "";
}

export function parseCheckout(body: unknown): CheckoutInput | CheckoutRejection {
  if (!body || typeof body !== "object") return { error: "Check the form and try again." };
  const input = body as Record<string, unknown>;

  if (!Array.isArray(input.lines) || input.lines.length < 1 || input.lines.length > maxLines) {
    return { error: "Add an item before you pay." };
  }

  const merged = new Map<string, { product: Product; size: string; quantity: number }>();
  for (const raw of input.lines) {
    if (!raw || typeof raw !== "object") return { error: "Check the cart and try again." };
    const line = raw as Record<string, unknown>;
    const product = products.find((item) => item.id === line.productId);
    if (!product || product.currency !== "EUR" || !Number.isInteger(product.priceCents) || product.priceCents < 0) {
      return { error: "An item in the cart is no longer for sale." };
    }
    if (/[|;%]/.test(product.id) || /[|;%]/.test(product.kind) || product.title.length > 160) {
      return { error: "Check the cart and try again." };
    }

    const size = lineSize(product, line.size);
    if (size === null) {
      return { error: product.sizes.length > 0 ? "Choose a size." : "Check the cart and try again." };
    }
    if (/[|;%]/.test(size)) return { error: "Choose a size." };

    if (!Number.isInteger(line.quantity) || (line.quantity as number) < 1 || (line.quantity as number) > 3) {
      return { error: "Quantity must be 1, 2, or 3." };
    }

    const key = `${product.id}\0${size}`;
    const quantity = (merged.get(key)?.quantity ?? 0) + (line.quantity as number);
    if (quantity > 3) return { error: "Quantity must be 1, 2, or 3." };
    merged.set(key, { product, size, quantity });
  }

  if (merged.size > maxLines) return { error: "Check the cart and try again." };

  const picked = [...merged.values()];
  const lines: OrderLine[] = picked.map(({ product, size, quantity }) => ({
    productId: product.id,
    title: product.title,
    kind: product.kind,
    size,
    quantity,
    unitCents: product.priceCents,
  }));

  if (!encodeLines(lines)) return { error: "Check the cart and try again." };

  const address = readAddress(input);
  if (!address.ok) return { error: copy.fieldsInvalid, fields: address.fields };

  if (typeof input.country !== "string" || !isShipCountry(input.country)) {
    return { error: "Choose a country." };
  }

  const classForShipment = shipmentClass(picked.map(({ product }) => product.shippingClass));
  const postage = shippingCents(input.country, classForShipment);
  const goods = lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);

  return {
    lines,
    shippingClass: classForShipment,
    shippingCents: postage,
    totalCents: goods + postage,
    name: address.value.name,
    email: address.value.email,
    street: address.value.street,
    postalCode: address.value.postalCode,
    city: address.value.city,
    country: input.country,
  };
}
