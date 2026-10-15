# Artist website — implementation spec

This file is the build brief. Implement what it says. Do not invent a CMS, an admin panel, a custom card form, or a second payment provider. Where a value is a placeholder like `ARTIST_NAME`, keep the placeholder in copy and in a single config file so it can be swapped without a refactor.

Fill `site.config.ts` before visual polish. Do not block the build on real copy.

## 0. Instructions to the implementing agent

- Build a Next.js App Router site that deploys to Vercel from GitHub.
- One marketing page and one shop page. Thank-you and cancel pages exist only as return targets for Mollie.
- Payments go through Mollie hosted checkout. The site never sees card numbers.
- Newsletter subscribers go to MailerLite. The site does not store emails.
- Paid orders are appended to a Google Sheet and emailed to the merchant. Track-and-trace mail is specified in `shipment.md` and is not part of the first build slice, beyond the sheet append and the merchant email.
- Prefer server components. Client components only for the mobile nav, the shop form, and any real interaction.
- Match the visual direction in section 4. Do not ship a centered dark SaaS template, a purple gradient, or a generic "band website theme".
- After each slice, the site must build and run locally with missing secrets showing a clear disabled state, not a crash.

Build in this order:

1. App shell, config, design tokens, nav, footer.
2. Home sections from local content files.
3. Shop catalog and product form, still without Mollie.
4. Mollie create-payment route, redirect, thank-you page.
5. Webhook: verify, idempotent sheet append, merchant email.
6. MailerLite form.
7. Motion, metadata, sitemap, privacy page, mobile pass.

## 1. What this site is

An artistic site for a singer-songwriter who plays venues in the Netherlands and is building a presence toward Armenia. Visitors come from shows, Instagram, and search.

They must be able to:

- see the latest release immediately
- find the next shows
- play songs and watch videos without leaving
- join the mailing list
- buy a shirt, CD, or vinyl and pay with iDEAL, card, or PayPal

The site is not a fan club, a blog, a ticket platform, or a warehouse system. Show sales happen in the room and never enter this shop.

## 2. Stack

- Next.js current stable, App Router, TypeScript, `src/` directory.
- React Server Components by default.
- CSS Modules plus a small global token file. No Tailwind unless the repo already has it. Do not add a component library.
- `next/font` for the two fonts in section 4.
- Framer Motion only if a CSS transition cannot do the job. Maximum three animated components.
- Mollie API v2 via `fetch`. Official `mollie-api-node` is allowed.
- MailerLite embedded form, or a custom form posting to MailerLite if the embed cannot be made transparent and on-brand.
- Resend for the merchant order email.
- Google Sheets as the order queue, via an Apps Script web app URL. See `shipment.md`.
- Hosting: Vercel. Domain is already owned and will be attached in the Vercel project. Do not hardcode the production host except as `NEXT_PUBLIC_SITE_URL`.
- Images in `public/` or remote patterns. No image CMS.

Node version: whatever the current Vercel default for Next.js is. Pin it in `package.json` engines and `.nvmrc`.

## 3. Routes

| Route | Purpose |
|---|---|
| `/` | Marketing page. All content sections. |
| `/shop` | Catalog and single-item checkout form. |
| `/shop/thank-you` | Mollie redirect target. Not a proof of payment. |
| `/shop/cancelled` | Mollie cancel/failed return. |
| `/privacy` | Privacy note for the list and the shop. |
| `/api/checkout` | POST. Creates a Mollie payment. |
| `/api/mollie/webhook` | POST. Verifies payment, appends sheet, emails merchant. |
| `/api/subscribe` | POST. Used only if the custom MailerLite form is chosen. |

No `/admin`. No auth. Orders are read in Mollie and in the sheet.

## 4. Visual direction — starting point, refine later

This is a deliberate default, not a brand lock. Change tokens in one file when real references arrive.

Mood: a printed lyric booklet, not a startup. Warm paper, near-black ink, one oxidized accent. Large type, tight crops, lots of quiet space. Photography should feel like stage light and rehearsal rooms, not stock concerts.

Tokens, in `src/styles/tokens.css`:

- `--bg: #14120f`
- `--bg-raised: #1c1915`
- `--paper: #f4efe6`
- `--ink: #16140f`
- `--muted: #a39b90`
- `--line: rgba(244, 239, 230, 0.16)`
- `--accent: #b6402c`
- `--accent-2: #d7a15e`

Type:

- Display: `Fraunces`, optical size up, for the artist name, release title, and section marks.
- Text: `Geist` or `Inter` if Geist is awkward, for UI and body.
- Do not use more than these two.

Layout:

- Home is a sequence of full-bleed bands, not a grid of equal cards.
- Latest release is the first viewport. Title, one image, one sentence, two actions: listen, see dates.
- Section labels are small, tracked-out, uppercase. Headlines are large and uneven on purpose.
- Shop is calmer than home: paper background, ink text, so the form is readable. The art direction still has to be obvious.
- Footer is a thin band: socials, privacy, contact mail. No sitemap dump.

Motion:

- CSS only for hover, image reveal, and nav.
- One scroll reveal on the release image is allowed.
- Respect `prefers-reduced-motion`: no transform, no parallax.
- Do not animate embeds. They are already heavy.
- Target: home LCP under 2.5s on a mid phone. No autoplay video in the hero.

Mobile:

- Design at 390px first.
- Nav becomes a button that opens a full-screen list. No hamburger library.
- Release actions stack. Show rows stay one column. Shop form is one column.
- Tap targets at least 44px. Sticky buy bar on `/shop` only after a product is selected.

## 5. Config and content

`src/config/site.ts` is the only place for identity:

```ts
export const site = {
  artistName: "ARTIST_NAME",
  shortName: "ARTIST_SHORT",
  description: "Songs, shows, and records.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  email: "hello@DOMAIN",
  socials: [
    { label: "Instagram", href: "https://instagram.com/HANDLE" },
    { label: "YouTube", href: "https://youtube.com/@HANDLE" },
    { label: "Spotify", href: "https://open.spotify.com/artist/ID" },
    { label: "TikTok", href: "https://tiktok.com/@HANDLE" },
  ],
}
```

Content files, edited by hand:

- `content/release.json` — latest release
- `content/shows.json` — upcoming dates
- `content/music.json` — Spotify embeds or track URLs
- `content/videos.json` — YouTube ids
- `content/products.json` — merch

No MDX, no database, no Notion sync in v1.

### release.json

```json
{
  "title": "Release title",
  "type": "Single",
  "date": "2026-10-01",
  "blurb": "One or two sentences.",
  "cover": "/media/release-cover.jpg",
  "spotifyEmbedUrl": "https://open.spotify.com/embed/track/...",
  "youtubeId": ""
}
```

### shows.json

```json
[
  {
    "date": "2026-11-14",
    "city": "Tilburg",
    "venue": "Venue name",
    "country": "NL",
    "ticketUrl": "",
    "soldOut": false
  }
]
```

Render upcoming dates only (`date >= today` in Europe/Amsterdam). Past dates are omitted, not styled as past. Sort ascending. If the list is empty, show "No announced shows. The list is the place to hear first." and point at the newsletter.

A show with an empty `ticketUrl` renders the venue and city without a button. Do not invent ticket links.

### music.json and videos.json

Spotify: store the embed URL, render the official iframe, height 152 for a track and 352 for a playlist. Lazy-load below the fold.

YouTube: store the video id only. Render `youtube-nocookie.com/embed/ID` with `loading="lazy"` and `title` set to the song name. No YouTube API.

### products.json

```json
[
  {
    "id": "cd-debut",
    "title": "Debut CD",
    "kind": "cd",
    "priceCents": 1200,
    "currency": "EUR",
    "image": "/media/cd.jpg",
    "description": "One sentence.",
    "sizes": [],
    "stock": 40,
    "shippingClass": "letterbox"
  },
  {
    "id": "shirt-tour",
    "title": "Tour shirt",
    "kind": "shirt",
    "priceCents": 3000,
    "currency": "EUR",
    "image": "/media/shirt.jpg",
    "description": "One sentence.",
    "sizes": ["S", "M", "L", "XL"],
    "stock": 20,
    "shippingClass": "parcel"
  }
]
```

`stock` is a display hint, not a lock. The webhook does not decrement the JSON file. Oversell risk at this volume is accepted. Document it in the shop UI only if stock is 3 or below: "Few left".

## 6. Home page sections, in order

1. Nav. Artist name left. Links: Music, Shows, Videos, List, Shop. Shop can be a text button in the accent color.
2. Release. Cover, type, title, blurb, Spotify embed or a link to the music section, and the release date.
3. Shows. Rows of date, city, venue, optional ticket link.
4. Music. Two or three Spotify embeds from `music.json`.
5. Videos. Two YouTube embeds. Not a carousel.
6. List. Short line on what the mail is (shows, songs, nothing else). MailerLite form. No popup.
7. Shop tease. Two products and a link to `/shop`. Not a second checkout.
8. Footer. Socials, `hello@DOMAIN`, privacy link.

Anchor ids: `#music`, `#shows`, `#videos`, `#list`.

## 7. Shop

`/shop` lists every product in `products.json`. Selecting one reveals the form on the same page. V1 is single-item checkout: one product, one size, quantity 1 to 3. No cart. A cart is a later project because one payment must stay one shipment.

Form fields:

- size, required when `sizes` is non-empty
- quantity
- full name
- email
- street and number
- postal code
- city
- country, select: Netherlands, Belgium, Armenia, Other

Shipping, in `src/config/shipping.ts`:

| Country | Letterbox (CD) | Parcel (shirt, vinyl) |
|---|---|---|
| NL | 455 cents | 695 cents |
| BE | 895 cents | 1295 cents |
| AM and Other | 1450 cents | 1895 cents |

These are starting prices, not PostNL contracts. Show shipping before pay. Total = product × qty + shipping. Currency EUR only.

On submit, POST `/api/checkout`. Disable the button. On success, `location.href` to the Mollie checkout URL. On failure, show the error under the button. Do not clear the address.

Thank-you page copy: "Payment received if your bank confirmed it. A mail follows when the parcel is handed to PostNL." Do not say the order is paid based only on landing here. Mollie redirects on completion, including some failures. The webhook is the source of truth.

Cancelled page: link back to `/shop`.

## 8. Mollie

Human prerequisite, not code: a Mollie account on the Dutch entity, KvK, bank account, and the methods iDEAL, cards, and PayPal enabled. Test key first.

Env:

```
MOLLIE_API_KEY=
NEXT_PUBLIC_SITE_URL=
MERCHANT_ORDER_EMAIL=
RESEND_API_KEY=
RESEND_FROM=
SHEET_WEBHOOK_URL=
SHEET_WEBHOOK_SECRET=
```

`/api/checkout` rules:

- Accept JSON only. Validate with zod or a hand-rolled guard.
- Product id must exist. Size must be allowed. Quantity 1–3. Email must look like an email. Address fields required and length-capped.
- Amount is computed on the server from `products.json` and `shipping.ts`. Never trust a client price.
- Create a Mollie payment:

```
POST https://api.mollie.com/v2/payments
amount: { currency: "EUR", value: "31.95" }  // string with 2 decimals
description: "ARTIST_SHORT — Tour shirt / M"
redirectUrl: ${SITE_URL}/shop/thank-you?order=${orderId}
cancelUrl: ${SITE_URL}/shop/cancelled
webhookUrl: ${SITE_URL}/api/mollie/webhook
metadata: {
  orderId, productId, title, size, quantity,
  shippingCents, totalCents,
  name, email, street, postalCode, city, country
}
```

- Leave `method` unset so Mollie shows iDEAL, cards, and PayPal.
- `orderId` is `ord_` + 12 url-safe random chars. Store nothing locally. The id travels in metadata.
- Return `{ checkoutUrl }` from Mollie's `_links.checkout.href`.
- Do not log address or email.

Webhook rules:

- Mollie posts `id`. Read it from the form body.
- Fetch `GET /v2/payments/{id}` with the secret key. Trust that response, not the redirect and not the POST body.
- Act only when `status === "paid"`. Ignore `open`, `pending`, `expired`, `canceled`, `failed`.
- Idempotency: before appending, the sheet endpoint must no-op if `orderId` already exists. The Next route also keeps a short-lived guard if easy, but the sheet is the real lock. Mollie retries webhooks.
- On first paid event: POST the order to `SHEET_WEBHOOK_URL` with header `x-sheet-secret`, then send the merchant email.
- Respond 200 quickly after those two succeed. If the sheet fails, respond 500 so Mollie retries. If the sheet succeeded and the email failed, still respond 200 and log the email failure, so a retry does not duplicate the row. The sheet's idempotency makes a retry safe anyway. Prefer 500 until the sheet has accepted the row.
- Never decrement stock in git.

Merchant email, via Resend, to `MERCHANT_ORDER_EMAIL`:

- subject: `Order {orderId} — {title}`
- body: item, size, qty, total, Mollie payment id, and the full shipping address
- reply-to: buyer email

This mail is for the human who packs. The buyer does not get a mail at payment time in v1. Their mail is the track-and-trace mail in `shipment.md`.

## 9. Newsletter

Default: MailerLite embedded form.

- Build the form in MailerLite with a transparent background, ink-colored text on the home band, paper-colored text if it sits on `--bg`.
- Paste the HTML snippet into a server component.
- Double opt-in stays on. Do not bypass it.
- Copy next to the form: what they get, and that they can leave any time.
- If the embed CSS cannot be made acceptable, replace it with `/api/subscribe` posting to the MailerLite API. Same list, same double opt-in. Do not store the address in logs.

Do not add the buyer to the newsletter because they purchased. Checkout has no marketing checkbox in v1.

## 10. Legal pages, minimum

`/privacy` covers:

- the site itself stores no accounts
- MailerLite processes list signups, double opt-in, EU
- Mollie processes payments
- the order sheet holds name, email, address, and item until the parcel is delivered, then the row can be cleared by the operator
- contact email for access or deletion requests

No cookie banner if there is no analytics and no non-essential cookie. Do not add Google Analytics, Meta pixel, or a heatmap in v1.

Shop footer line: physical goods, 14-day withdrawal inside the EU, buyer pays return postage unless the item is wrong or damaged. This is a starting text, not legal advice. Leave a `LEGAL_REVIEW` comment above it.

BTW: prices are shown as a single amount. Add a config flag `pricesIncludeVat: true` and a one-line note "Prices include BTW where applicable." Do not build a tax engine.

## 11. Performance and accessibility

- Covers exported as webp, max 1600px on the long edge.
- `next/image` for local media. Explicit width and height.
- Embeds lazy, below the fold, never in the first viewport except the single release Spotify embed.
- Color contrast of body text at least 4.5:1.
- Form errors tied to fields with `aria-describedby`.
- Visible focus states.
- `lang` on `<html>` is `en` unless copy is Dutch. Default copy in this spec is English. Artist may later switch the UI to Dutch; do not hardcode sentences in ten components. Put UI strings in `src/config/copy.ts`.

## 12. Deployment

- GitHub repo connected to Vercel. `main` deploys to production.
- Env vars set in Vercel for Production and Preview. Preview uses the Mollie test key.
- `NEXT_PUBLIC_SITE_URL` is the custom domain in production, the preview URL is fine on preview deployments. Webhooks in preview are optional. Production webhook URL must be the custom domain, HTTPS.
- Mollie webhook endpoint must be reachable without auth.
- Add `sitemap.ts` and `robots.ts`. Shop thank-you and cancelled are `noindex`.

## 13. Done

- Home renders release, future shows, Spotify, YouTube, list, shop tease, footer, on a 390px and a 1280px viewport.
- `/shop` creates a Mollie test payment for the correct server-side total and redirects.
- A paid test webhook appends one sheet row and emails the merchant once, even if Mollie retries.
- Failed and open payments do not append.
- MailerLite form submits.
- `npm run build` passes.
- No admin, no cart, no card inputs, no second payment provider.

## 14. Explicitly out of scope

- Cart and discount codes
- Stock decrement in the repo
- Customer account and order lookup
- Ticket sales
- Print-on-demand
- Sendcloud
- Armenian payment methods (Idram, ArCa, Telcell)
- Analytics
- A CMS
- The track-and-trace mail itself (see `shipment.md`)
