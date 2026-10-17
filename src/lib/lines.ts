import type { ShippingClass } from "@/config/shipping";

export type OrderLine = {
  productId: string;
  title: string;
  kind: string;
  size: string;
  quantity: number;
  unitCents: number;
};

const kindLabels: Record<string, string> = {
  cd: "CD",
  vinyl: "Vinyl",
};

export function formatKind(kind: string) {
  if (kindLabels[kind]) return kindLabels[kind];
  if (!kind) return "";
  return kind.slice(0, 1).toUpperCase() + kind.slice(1);
}

export function lineLabel(line: { title: string; kind: string; size: string }) {
  const kind = formatKind(line.kind);
  if (!kind) return line.size ? `${line.title} / ${line.size}` : line.title;
  return line.size ? `${line.title} (${kind}, ${line.size})` : `${line.title} (${kind})`;
}

export function goodsCents(lines: OrderLine[]) {
  return lines.reduce((sum, line) => sum + line.unitCents * line.quantity, 0);
}

export function orderQuantity(lines: OrderLine[]) {
  return lines.reduce((sum, line) => sum + line.quantity, 0);
}

export function sheetTitle(lines: OrderLine[]) {
  if (lines.length === 1) return lineLabel(lines[0]);
  return lines.map((line) => `${lineLabel(line)} × ${line.quantity}`).join("; ");
}

export function shipmentClass(classes: ShippingClass[]): ShippingClass {
  return classes.includes("parcel") ? "parcel" : "letterbox";
}

export function encodeLines(lines: OrderLine[]) {
  const encoded = lines
    .map((line) =>
      [
        line.productId,
        String(line.quantity),
        line.size,
        String(line.unitCents),
        line.kind,
        encodeURIComponent(line.title),
      ].join("|"),
    )
    .join(";");
  if (encoded.length > 800) return null;
  return encoded;
}

export function decodeLines(value: string): OrderLine[] | null {
  if (!value || value.length > 800) return null;
  const parts = value.split(";");
  if (parts.length < 1 || parts.length > 6) return null;
  const lines: OrderLine[] = [];
  for (const part of parts) {
    const bits = part.split("|");
    if (bits.length !== 6) return null;
    const [productId, qty, size, cents, kind, titleEnc] = bits;
    const quantity = Number(qty);
    const unitCents = Number(cents);
    if (!/^[a-z0-9-]{1,40}$/.test(productId)) return null;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 3) return null;
    if (!Number.isInteger(unitCents) || unitCents < 0) return null;
    if (size.length > 16 || /[|;%]/.test(size) || /[|;%]/.test(kind)) return null;
    let title = "";
    try {
      title = decodeURIComponent(titleEnc);
    } catch {
      return null;
    }
    if (!title || title.length > 160) return null;
    if (lines.some((line) => line.productId === productId && line.size === size)) return null;
    lines.push({ productId, title, kind, size, quantity, unitCents });
  }
  return lines;
}
