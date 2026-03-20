# What's Been Built

## Step 1: Database Layer

**Drizzle ORM + Neon PostgreSQL**

- Driver: `@neondatabase/serverless` (neon-http)
- ORM: `drizzle-orm`
- Migrations/tooling: `drizzle-kit`
- Config: `drizzle.config.ts` at project root
  - Schema glob: `src/db/schema/*`
  - Output: `src/db/migrations`
  - Loads `DATABASE_URL` from `.env.local` via `dotenv`

**7 tables** (see `data-model.md` for full schema):
- `users`
- `recipes`
- `platforms`
- `recipe_platforms` (junction)
- `tags`
- `recipe_tags` (junction)
- `test_history`

**npm scripts:**
- `npm run db:push` — push schema to Neon via drizzle-kit
- `npm run db:studio` — open Drizzle Studio

---

## Step 2: Seed Script

File: `src/db/seed.ts`

Clears all data in FK-safe order, then inserts:

- **3 platforms**: Claude Projects, ChatGPT Custom GPTs, Gemini Gems
- **22 tags** across 3 categories:
  - `use_case` (8): prompt-engineering, code-review, writing-assistant, research, brainstorming, debugging, learning, automation
  - `domain` (8): software-engineering, marketing, academia, product-management, design, data-science, legal, finance
  - `style` (6): concise, detailed, conversational, formal, step-by-step, socratic
- **8 recipes** with full prompt instructions (see data-model.md for list)
- **24 recipe_platforms rows** — every recipe linked to all 3 platforms
- **24 recipe_tags rows** — 3 tags per recipe

**npm script:**
- `npm run db:seed` — runs `DOTENV_CONFIG_PATH=.env.local npx tsx -r dotenv/config src/db/seed.ts`

The `-r dotenv/config` flag preloads env vars before any module import, which is necessary because `src/db/index.ts` calls `neon(process.env.DATABASE_URL!)` at import time.

---

## Step 3: Recipe Discovery UI

**Query layer** (`src/lib/queries/recipes.ts`):
- `getFeaturedRecipes()` -- featured=true, ordered by `created_at` desc, with platforms + tags
- `getCategories()` -- GROUP BY category with `count(*)::int`, ordered by count desc
- `getPlatforms()` -- all platforms ordered by name, used for filter bar
- `searchRecipes({ query, category, platform, tags })` -- dynamic WHERE builder:
  - Text: `search_vector @@ to_tsquery(...)`, ordered by `ts_rank(...)` desc
  - Category: raw SQL equality to avoid enum type casting issues
  - Platform: `inArray` with subquery through `recipe_platforms`
  - Tags: one `inArray` subquery per tag (must match ALL tags)
  - `attachRelations()` helper fetches platforms + tags in 2 parallel queries after filtering

**Shared components** (`src/components/`):
- `RecipeCard.tsx` -- server component; category color badge, `line-clamp-2` description, platform pills, tag pills (first 3), upvote count
- `CategoryCard.tsx` -- server component; emoji + name + count, links to `?category=X`
- `SearchBar.tsx` -- client component; `useRouter` navigation, `defaultValue` prop for pre-fill

**Pages:**
- `src/app/page.tsx` -- hero + SearchBar + featured grid + category grid
- `src/app/recipes/page.tsx` -- awaits `searchParams` (Next.js 15), category/platform filter pills with active state, `buildUrl` helper preserves other params, result count + clear link, empty state

---

## Step 4: Recipe Detail Page

**New query functions** in `src/lib/queries/recipes.ts`:
- `getRecipeBySlug(slug)` -- left joins users for author name, parallel fetches platforms (with `platformSpecificNotes`) + tags; returns `RecipeDetail | null`
- `getRelatedRecipes(recipeId, category, limit?)` -- same category, excludes self, ordered by upvotes desc, uses `attachRelations`

**New component:**
- `src/components/CopyButton.tsx` -- client component; `navigator.clipboard.writeText()`, cycles through idle/copied/error states with 2s reset

**New pages:**
- `src/app/recipes/[slug]/page.tsx` -- `generateMetadata` for SEO; breadcrumb (Home > Recipes > Category > Title); header with title, category badge, platform + tag pills, upvote count, author; description; instructions block with `CopyButton`; platform-specific notes section (hidden when none); Test CTA card; related recipes grid
- `src/app/recipes/[slug]/not-found.tsx` -- friendly 404 with link back to /recipes

---

## Current File Tree

```
promptocean/
├── .claude/
│   └── docs/
│       ├── built.md
│       └── data-model.md
├── .env.example
├── .env.local                  # not committed
├── drizzle.config.ts
├── package.json
├── src/
│   ├── app/
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx            # homepage
│   │   └── recipes/
│   │       ├── page.tsx        # search + browse page
│   │       └── [slug]/
│   │           ├── page.tsx    # recipe detail
│   │           └── not-found.tsx
│   ├── components/
│   │   ├── AuthButton.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── CopyButton.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── SearchBar.tsx
│   │   └── SessionProvider.tsx
│   ├── db/
│   │   ├── index.ts            # drizzle instance (neon-http)
│   │   ├── seed.ts
│   │   ├── migrations/         # empty until db:push runs
│   │   └── schema/
│   │       ├── index.ts        # barrel export
│   │       ├── users.ts
│   │       ├── recipes.ts
│   │       ├── platforms.ts
│   │       ├── recipe_platforms.ts
│   │       ├── tags.ts
│   │       ├── recipe_tags.ts
│   │       └── test_history.ts
│   ├── lib/
│   │   ├── auth.ts
│   │   └── queries/
│   │       └── recipes.ts
│   └── types/
│       └── next-auth.d.ts
├── middleware.ts               # route protection (project root, NOT src/)
├── next.config.ts              # image remotePatterns for Google profile photos
├── tsconfig.json
└── ...
```

---

## Step 5: Auth (NextAuth v5 + Google OAuth)

- `next-auth@beta` installed
- `src/lib/auth.ts` -- NextAuth config with JWT strategy, Google provider, three callbacks:
  - `signIn`: upserts user in `users` table by email (insert on first login, update name/image if changed)
  - `jwt`: on initial sign-in, looks up DB user by email and attaches `token.userId` (our uuid, not Google's sub)
  - `session`: fetches `subscriptionStatus` and `freeTestsRemaining` from DB on each session access; attaches `id`, `subscriptionStatus`, `freeTestsRemaining` to `session.user`
- `src/types/next-auth.d.ts` -- augments `Session` (id, subscriptionStatus, freeTestsRemaining) and `JWT` (userId)
- `src/app/api/auth/[...nextauth]/route.ts` -- exports GET and POST from handlers
- `middleware.ts` (project root) -- route protection for `/submit` and `/dashboard`; redirects unauthenticated users to sign-in with `callbackUrl`
- `src/components/AuthButton.tsx` -- client component; `useSession` for state, `signIn('google')` / `signOut()` from `next-auth/react`; loading skeleton while session resolves
- `src/components/SessionProvider.tsx` -- thin client wrapper around `SessionProvider` from `next-auth/react`
- `src/app/layout.tsx` -- global nav (PromptOcean logo, Browse, Submit, AuthButton) + shared footer; per-page navs/footers removed from all three existing pages
- `next.config.ts` -- `images.remotePatterns` whitelists `lh3.googleusercontent.com` for Google profile photos
- `.env.example` updated with `AUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**No separate accounts/sessions/verification_tokens tables** -- JWT strategy only; `users` table is the single source of truth.

---

## Not Built Yet

- **Submit page** -- `/submit` route protected by middleware but page doesn't exist yet
- **Dashboard** -- `/dashboard` route protected but page doesn't exist yet
- **Upvoting** -- `upvotes` column exists, no UI action to increment it yet
- **Stripe** -- `stripe_customer_id` column exists on `users`, nothing else
- **Recipe testing UI** -- the feature that consumes `test_history`
- **Admin / moderation** -- no tooling for managing recipes or users
