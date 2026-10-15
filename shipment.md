# Shipment flow

What happens after a site order is paid, and how the track-and-trace mail is sent. Show sales are not part of this flow. If the item is handed over at a venue, it never enters the sheet.

This file is the operator guide and the spec for the two small pieces of automation: the sheet append, and the mail that goes out when a tracking code is pasted.

## 1. Roles

- Mollie decides that money arrived.
- The site webhook is the only writer of new rows.
- The Google Sheet is the queue.
- The person packing buys the PostNL label and pastes the code.
- Resend sends the buyer mail after that paste.
- MailerLite is not involved. A shipping notice is transactional. Do not send it from the newsletter tool, and do not add the buyer to the list.

## 2. Human steps that stay human

1. Read the merchant email, or the new sheet row.
2. Pack the item. CDs in a rigid brievenbusdoos. Shirts in a mailer. Vinyl in a record mailer with stiffeners. Buy those in bulk once.
3. Buy the label on PostNL online franking, or in Sendcloud later. Letterbox for a CD, parcel for a shirt or vinyl.
4. Paste the barcode into the sheet column `trackingCode`.
5. Drop the parcel off or book a pickup.

The mail to the buyer is the only automated step after payment.

## 3. Sheet

One Google Sheet, tab `orders`, owned by the site maintainer. Share edit access with whoever packs. A later handover is a share or a CSV export.

Header row, exact names:

| Column | Written by | Notes |
|---|---|---|
| orderId | webhook | unique |
| paidAt | webhook | ISO 8601 |
| molliePaymentId | webhook | |
| title | webhook | |
| size | webhook | empty if none |
| quantity | webhook | |
| totalCents | webhook | |
| name | webhook | |
| email | webhook | buyer |
| street | webhook | |
| postalCode | webhook | |
| city | webhook | |
| country | webhook | NL, BE, AM, or Other |
| shippingClass | webhook | letterbox or parcel |
| trackingCode | human | empty until pasted |
| trackingSentAt | script | empty until mail succeeds |
| notes | human | optional |

Do not reorder these columns. The script reads by header name, not by index.

## 4. Append path

The Next.js webhook, after it has fetched the payment from Mollie and seen `status === "paid"`, POSTs JSON to a Google Apps Script web app.

```
POST SHEET_WEBHOOK_URL
x-sheet-secret: SHEET_WEBHOOK_SECRET
{
  orderId, paidAt, molliePaymentId, title, size, quantity,
  totalCents, name, email, street, postalCode, city, country,
  shippingClass
}
```

The Apps Script:

- rejects a missing or wrong secret with 401
- finds `orders`
- if `orderId` already exists, responds `{ ok: true, duplicate: true }` and writes nothing
- otherwise appends a row with an empty `trackingCode` and empty `trackingSentAt`
- responds `{ ok: true }`

The Next route treats non-200 as failure so Mollie retries. Duplicate `orderId` is success.

Deploy the script as a web app, execute as the sheet owner, access restricted to anyone with the link is acceptable only because the secret is checked. Do not leave the secret empty.

## 5. Track-and-trace mail

A second function in the same Apps Script project, installed as an `onEdit` trigger.

When a cell in `trackingCode` changes from blank to a non-empty value:

- read the row by header
- if `trackingSentAt` is already set, stop
- if `email` is empty, stop and write `missing email` in `notes`
- POST to Resend:

```
POST https://api.resend.com/emails
Authorization: Bearer RESEND_API_KEY
from: RESEND_FROM          // orders@DOMAIN, domain verified in Resend
to: buyer email
reply_to: MERCHANT_ORDER_EMAIL
subject: Your order is on the way — {title}
text: see template below
```

- on success, write the ISO timestamp into `trackingSentAt`
- on failure, write the error into `notes` and leave `trackingSentAt` empty so a later edit can retry

Paste once. Editing the code after `trackingSentAt` is set must not send again. To resend, clear `trackingSentAt` and edit the code.

Template, plain text:

```
Hi {first name},

Your {title}{size phrase} is on the way.

Track it: https://postnl.nl/tracktrace/?B={trackingCode}&D={country}&P={postalCode}&T=C

If the link does not open, the barcode is {trackingCode}.

Questions go to {MERCHANT_ORDER_EMAIL}.

{ARTIST_NAME}
```

`size phrase` is ` (size M)` or empty. Postal code in the PostNL link has no spaces.

Resend free tier is enough: 3,000 mails a month, 100 a day. Verify the sending domain before the first real order. Set `RESEND_API_KEY` and `RESEND_FROM` as Apps Script properties, not in the sheet.

## 6. What the buyer receives, and when

- At payment: nothing from us. Mollie or their bank may show their own confirmation.
- When the label code is pasted: one mail, from `orders@DOMAIN`.
- Newsletter: only if they used the list form. Purchase does not subscribe them.

## 7. Failures

- Webhook cannot reach the sheet: Mollie retries. No row, no merchant mail yet. Check the Vercel log.
- Row written, merchant mail failed: row exists, Mollie may retry, sheet idempotency prevents a second row. Send yourself the missing merchant mail by hand if needed.
- Tracking mail failed: `notes` has the error, `trackingSentAt` empty. Fix the cause, clear nothing else, re-edit the code or re-run the function on that row.
- Wrong address: do not automate a fix. Note it in `notes`. If PostNL returns it, refund in the Mollie dashboard.

## 8. Not now

Sendcloud, or any label API, is a later swap. It becomes worth it when web shipments are a weekly chore, on the order of a few dozen a month. Then "paste the code" becomes "click ship", and this sheet can stay the queue.

A 3PL is a later swap of the human steps, not of this file. They would still need the same row. They do not take complaints or chargebacks. Those stay with the seller and with Mollie.

## 9. Done

- A paid Mollie test payment creates exactly one row.
- A second webhook delivery does not create a second row.
- Pasting a fake barcode sends one mail and fills `trackingSentAt`.
- Pasting again does not send again.
- An empty payment status does not write a row.
- Show sales never appear in the sheet.
