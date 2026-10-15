# ARA website

Next.js site for the artist page and shop. The build brief is `website-implementation.md`. Shipping mail is `shipment.md`.

## Requirements

- Node 24. The repo pins it in `.nvmrc` and `package.json`.
- npm

```bash
nvm use
node -v
```

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000.

The site must build with the env values empty. Fill `.env.local` when a slice needs Mollie, Resend, or the sheet webhook. Do not commit `.env.local`.

## Scripts

```bash
npm run dev
npm run build
npm run start
```

## Deploy

Pushing `main` deploys to Vercel. The project framework preset must be **Next.js**. Output directory stays empty.

Set the same env vars in Vercel for Production and Preview. Preview uses the Mollie test key.
