import { formatEuros } from "@/lib/money";
import { lineLabel } from "@/lib/lines";
import type { PaidOrder } from "@/lib/mollie";

const serif = "Georgia, 'Iowan Old Style', 'Palatino Linotype', serif";
const sans = "Helvetica, Arial, sans-serif";
const copyTo = "v.abrahamian@hotmail.com";

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function firstName(name: string) {
  const word = name.trim().split(/\s+/)[0];
  return word || name.trim();
}

function shippingLabel(shippingClass: string) {
  if (shippingClass === "letterbox") return "Letterbox";
  if (shippingClass === "parcel") return "Parcel";
  return shippingClass;
}

function buyerText(order: PaidOrder) {
  const lines = order.lines.map(
    (line) => `${lineLabel(line)} × ${line.quantity} — ${formatEuros(line.unitCents * line.quantity)}`,
  );
  return [
    `Hi ${firstName(order.name)},`,
    "",
    "Your payment is in. A tracking mail follows when the parcel is handed to PostNL.",
    "",
    ...lines,
    `Shipping (${shippingLabel(order.shippingClass)}): ${formatEuros(order.shippingCents)}`,
    `Total: ${formatEuros(order.totalCents)}`,
    "",
    "Shipping to",
    order.name,
    order.street,
    `${order.postalCode} ${order.city}`,
    order.country,
    "",
    `Order ${order.orderId}`,
  ].join("\n");
}

function buyerHtml(order: PaidOrder) {
  const rows = order.lines
    .map((line) => {
      const label = escapeHtml(`${lineLabel(line)} × ${line.quantity}`);
      const amount = escapeHtml(formatEuros(line.unitCents * line.quantity));
      return `<tr>
        <td style="padding:10px 0;border-top:1px solid #e4d8c4;font-family:${sans};font-size:15px;line-height:1.4;color:#16140f;">${label}</td>
        <td align="right" style="padding:10px 0 10px 16px;border-top:1px solid #e4d8c4;font-family:${sans};font-size:15px;line-height:1.4;color:#16140f;white-space:nowrap;">${amount}</td>
      </tr>`;
    })
    .join("");
  const name = escapeHtml(firstName(order.name));
  const ship = escapeHtml(
    [order.name, order.street, `${order.postalCode} ${order.city}`, order.country].join("\n"),
  ).replaceAll("\n", "<br>");

  return `<!doctype html>
<html lang="en">
<body style="margin:0;padding:0;background:#f4efe6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4efe6;">
    <tr>
      <td align="center" style="padding:48px 20px;">
        <table role="presentation" width="460" cellpadding="0" cellspacing="0" style="width:100%;max-width:460px;">
          <tr>
            <td style="font-family:${serif};font-size:28px;letter-spacing:0.14em;color:#16140f;">ARA</td>
          </tr>
          <tr>
            <td style="padding-top:28px;font-family:${serif};font-size:26px;line-height:1.25;color:#16140f;">Thank you, ${name}.</td>
          </tr>
          <tr>
            <td style="padding-top:12px;font-family:${sans};font-size:15px;line-height:1.5;color:#5c564e;">Your payment is in. A tracking mail follows when the parcel is handed to PostNL.</td>
          </tr>
          <tr>
            <td style="padding-top:28px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${rows}
                <tr>
                  <td style="padding:10px 0;border-top:1px solid #e4d8c4;font-family:${sans};font-size:15px;color:#5c564e;">Shipping, ${escapeHtml(shippingLabel(order.shippingClass))}</td>
                  <td align="right" style="padding:10px 0 10px 16px;border-top:1px solid #e4d8c4;font-family:${sans};font-size:15px;color:#5c564e;white-space:nowrap;">${escapeHtml(formatEuros(order.shippingCents))}</td>
                </tr>
                <tr>
                  <td style="padding:12px 0 0;border-top:1px solid #16140f;font-family:${serif};font-size:18px;color:#16140f;">Total</td>
                  <td align="right" style="padding:12px 0 0 16px;border-top:1px solid #16140f;font-family:${serif};font-size:18px;color:#16140f;white-space:nowrap;">${escapeHtml(formatEuros(order.totalCents))}</td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:32px;font-family:${sans};font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#8a8378;">Shipping to</td>
          </tr>
          <tr>
            <td style="padding-top:8px;font-family:${sans};font-size:15px;line-height:1.5;color:#16140f;">${ship}</td>
          </tr>
          <tr>
            <td style="padding-top:32px;font-family:${sans};font-size:13px;color:#8a8378;">Order ${escapeHtml(order.orderId)}</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

async function sendResend(body: Record<string, string>) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  if (!key || !from) throw new Error("email is not configured");

  const bcc = body.to.trim().toLowerCase() === copyTo ? undefined : copyTo;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from, ...body, ...(bcc ? { bcc } : {}) }),
  });

  if (!response.ok) throw new Error(`email failed: ${response.status}`);
}

export async function sendBuyerEmail(order: PaidOrder) {
  const replyTo = process.env.MERCHANT_ORDER_EMAIL?.trim();
  if (!replyTo) throw new Error("buyer email is not configured");

  await sendResend({
    to: order.email,
    subject: "Your ARA order",
    html: buyerHtml(order),
    text: buyerText(order),
    reply_to: replyTo,
  });
}

export async function sendMerchantEmail(order: PaidOrder) {
  const to = process.env.MERCHANT_ORDER_EMAIL?.trim();
  if (!to) throw new Error("merchant email is not configured");

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

  await sendResend({
    to,
    subject: `Order ${order.orderId} — ${order.title}`,
    text,
    reply_to: order.email,
  });
}
