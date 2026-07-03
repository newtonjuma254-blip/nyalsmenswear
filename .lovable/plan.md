## Scope

Convert `nyals-website-v4.html` into the TanStack Start app. Keep the exact dark/gold visual system (Cormorant Garamond + Syne, gold `#c9a84c`, dark `#0d0c0a`, noise grain, marquee, cards, hover animations). Replace localStorage with Lovable Cloud for products + admin auth. Add mobile hamburger. Embed real Google Map.

## Design system

- Move the entire `[data-theme="dark"]` / `[data-theme="light"]` tokens and every hand-written class from the upload into `src/styles.css` verbatim (below the shadcn `@theme` block, in a plain CSS layer so it's untouched by Tailwind).
- Load Cormorant Garamond + Syne via `<link>` in `__root.tsx` head (per Tailwind v4 rules — no remote `@import`).
- Keep dark/light toggle driven by `data-theme` on `<html>`, persisted in `localStorage` (the ONE localStorage use we keep — theme preference only).

## Routes

```text
/                → home  (hero, marquee, categories, about, testimonials, location w/ real map, ethics, footer)
/products        → shop-all, category filter via ?cat=Suits
/admin           → login (Supabase email/password) OR dashboard when signed in
```

Nav in a shared `<SiteHeader/>` component. Mobile hamburger opens a Radix Sheet with the same links (design mirrors the existing header — dark overlay, gold accents).

## Google Map

Real embed iframe (no API key needed) at coords resolved from the shared link — Nyals (K) Ltd Exclusive Mens Wear, `-1.2844161, 36.824948`:

```html
<iframe src="https://www.google.com/maps?q=-1.2844161,36.824948&z=17&output=embed"
        loading="lazy" referrerpolicy="no-referrer-when-downgrade" />
```

Styled inside the existing `.loc-map` frame (kept 380px, gold border).

## Cloud backend

Enable Lovable Cloud, then one migration:

```sql
create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  sku text unique not null,
  name text not null,
  category text not null,     -- Suits | Shirts | Trousers | Footwear | Accessories
  price numeric(10,2) not null,
  price_was numeric(10,2),
  description text,
  material text,
  sizes text[] default '{}',
  images text[] default '{}',
  in_stock boolean default true,
  badge text,                 -- 'new' | 'sale' | null
  created_at timestamptz default now()
);
-- grants + public SELECT policy; admin-only write via has_role('admin')

create type app_role as enum ('admin');
create table public.user_roles (user_id uuid references auth.users on delete cascade, role app_role, primary key(user_id, role));
-- has_role() security-definer function
```

Seed `newtonjuma254@gmail.com` as admin via a trigger that inserts into `user_roles` when that email signs up (handles first-login promotion without needing the user to exist yet).

## Server functions

- `listProducts` (public, publishable client, filter by category)
- `getProduct` (public, by slug)
- `createProduct` / `updateProduct` / `deleteProduct` (admin-gated: `requireSupabaseAuth` + `has_role` check)

Products page + home category counts read via TanStack Query. Admin dashboard reads via authenticated server fn and mutates via `useMutation` + invalidation.

## Admin UI

Reuse the upload's admin styles (`.admin-*`) but wired to real data:
- Login: Cloud email/password (sign-in only — admin is pre-seeded).
- Dashboard tabs: Overview (stats from real counts), Add/Edit Product (form with sizes/images arrays), Manage Products (grid with edit/delete), Sign Out.
- Image inputs: comma-separated URLs (simple v1; can upgrade to Cloud storage later).

## Mobile hamburger

Hamburger button appears below `md`. Sheet slides from right, dark bg, gold divider, same nav links + admin button + theme toggle. Existing `nav{display:none}` mobile rule stays; we swap in the trigger button.

## What's removed

- `showPage()` / `.page.active` display swapping → replaced by TanStack routing.
- `localStorage.products`, `localStorage.adminLoggedIn`, hardcoded password → replaced by Cloud + Supabase Auth.
- `.loc-map` placeholder inner (pin emoji, "Central Nairobi" text) → replaced by iframe.

## What stays exactly

Every visual token, every animation (marquee, arrow shake, pin pulse, page fade), Cormorant/Syne pairing, all section layouts, hero split, cats grid, product card hover, testimonials, footer, ethics banner.

## Deliverables (one turn)

1. Enable Cloud + migration
2. `src/styles.css` — append full design system
3. `src/routes/__root.tsx` — fonts, meta, theme init
4. `src/components/site-header.tsx` + hamburger sheet + footer
5. `src/routes/index.tsx` — home
6. `src/routes/products.tsx` — shop
7. `src/routes/admin.tsx` — login + dashboard
8. `src/lib/products.functions.ts` — server fns
9. Auth attacher wired in `src/start.ts`

Ready to build on approval.