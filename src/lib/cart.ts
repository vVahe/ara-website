export type CartLine = {
  productId: string;
  size: string;
  quantity: number;
};

export const emptyCart: CartLine[] = [];

const storageKey = "ara-cart";
const changeEvent = "ara-cart-change";
const maxLines = 6;
const maxQty = 3;
const idPattern = /^[a-z0-9-]{1,40}$/;

let cacheRaw: string | null = null;
let cacheLines: CartLine[] = emptyCart;

export function parseStored(raw: string): CartLine[] {
  if (!raw) return [];
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(value)) return [];
  const lines: CartLine[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") continue;
    const line = item as Record<string, unknown>;
    if (typeof line.productId !== "string" || !idPattern.test(line.productId)) continue;
    if (typeof line.size !== "string" || line.size.length > 16) continue;
    if (typeof line.quantity !== "number" || !Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > maxQty) {
      continue;
    }
    if (lines.some((existing) => existing.productId === line.productId && existing.size === line.size)) {
      continue;
    }
    lines.push({ productId: line.productId, size: line.size, quantity: line.quantity });
    if (lines.length === maxLines) break;
  }
  return lines;
}

export function sameCart(left: CartLine[], right: CartLine[]) {
  return (
    left.length === right.length &&
    left.every((line, index) => {
      const other = right[index];
      return (
        line.productId === other.productId &&
        line.size === other.size &&
        line.quantity === other.quantity
      );
    })
  );
}

export function addLine(
  lines: CartLine[],
  productId: string,
  size: string,
  amount = 1,
): CartLine[] | "qty" | "full" {
  if (!Number.isInteger(amount) || amount < 1 || amount > maxQty) return "qty";
  const index = lines.findIndex((line) => line.productId === productId && line.size === size);
  if (index === -1) {
    if (lines.length >= maxLines) return "full";
    return [...lines, { productId, size, quantity: amount }];
  }
  const current = lines[index];
  if (current.quantity + amount > maxQty) return "qty";
  return lines.map((line, lineIndex) =>
    lineIndex === index ? { ...line, quantity: line.quantity + amount } : line,
  );
}

export function setLineQuantity(
  lines: CartLine[],
  productId: string,
  size: string,
  quantity: number,
): CartLine[] {
  if (!Number.isInteger(quantity) || quantity < 1) {
    return lines.filter((line) => !(line.productId === productId && line.size === size));
  }
  const capped = Math.min(maxQty, quantity);
  return lines.map((line) =>
    line.productId === productId && line.size === size ? { ...line, quantity: capped } : line,
  );
}

export function removeLine(lines: CartLine[], productId: string, size: string) {
  return lines.filter((line) => !(line.productId === productId && line.size === size));
}

export function readCartSnapshot(): CartLine[] {
  const raw = localStorage.getItem(storageKey) ?? "";
  if (raw === cacheRaw) return cacheLines;
  cacheRaw = raw;
  const parsed = parseStored(raw);
  cacheLines = parsed.length === 0 ? emptyCart : parsed;
  return cacheLines;
}

export function subscribeCart(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(changeEvent, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(changeEvent, onChange);
  };
}

export function writeCart(lines: CartLine[]) {
  const next = lines.map((line) => ({ ...line }));
  const raw = JSON.stringify(next);
  cacheRaw = raw;
  cacheLines = next.length === 0 ? emptyCart : next;
  localStorage.setItem(storageKey, raw);
  window.dispatchEvent(new Event(changeEvent));
}

export function clearCart() {
  writeCart([]);
}

export function serverCartSnapshot() {
  return emptyCart;
}
