# Wicked Wick Co.

A boutique candle ecommerce site built on Astro 5 + Supabase + Stripe + Resend, deployed on Vercel. Built by [Harbor](https://harbor.dev).

## What was built
- 16 SEO-optimised pages: home, shop index, 6 product pages, cart, 2 checkout outcomes, about, faq, shipping & returns, contact, blog index, dynamic blog post route.
- Supabase schema with tables `ww_products`, `ww_orders`, `ww_content`, `ww_contact_submissions`. 6 candles seeded, products read live from the DB on every page.
- Dynamic Stripe Checkout (uses `price_data` — prices come from Supabase at request time) with shipping logic ($6 flat / free over $50).
- Stripe webhook at `/api/stripe/webhook` that writes an `ww_orders` row and fires a Resend order confirmation email.
- Contact form with Resend auto-reply + DB log.
- JSON-LD on every page (Organization, WebSite, Product, FAQPage, BlogPosting, CollectionPage, BreadcrumbList).
- robots.txt + auto-generated sitemap via `@astrojs/sitemap`.

## Local dev
```bash
cp .env.example .env  # fill in the real keys
npm install --legacy-peer-deps
npm run dev
```

## Environment variables
See `.env.example`. All are set on Vercel for production.

## Stack
- Astro 5 (`output: 'server'`) + `@astrojs/vercel` adapter
- Tailwind v4 via `@tailwindcss/vite`
- `@supabase/supabase-js` for the DB client
- `stripe` Node SDK
- Resend REST API for transactional email

## Where Harbor writes articles
The `ww_content` table is ready for Harbor's Writer tool. When articles are added there (with `published_at` set), they automatically appear at `/blog` and `/blog/<slug>` — no redeploy required.
