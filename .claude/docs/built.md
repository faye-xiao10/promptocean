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

## Step 5: Auth (NextAuth v5 + Google OAuth)

- `next-auth@beta` installed
- `src/lib/auth.ts` -- NextAuth config with JWT strategy, Google provider, three callbacks:
  - `signIn`: upserts user in `users` table by email (insert on first login, update name/image if changed)
  - `jwt`: on initial sign-in, fetches `id`, `subscriptionStatus`, `freeTestsRemaining` from DB and stores all three in the token; subsequent calls are token-only (no DB)
  - `session`: reads `userId`, `subscriptionStatus`, `freeTestsRemaining` from token -- no DB query
- `src/types/next-auth.d.ts` -- augments `Session` (id, subscriptionStatus, freeTestsRemaining) and `JWT` (userId, subscriptionStatus, freeTestsRemaining)
- `src/app/api/auth/[...nextauth]/route.ts` -- exports GET and POST from handlers
- `middleware.ts` (project root) -- route protection for `/submit`, `/dashboard`, `/recipes/*/test`; redirects unauthenticated users to sign-in with `callbackUrl`
- `src/components/AuthButton.tsx` -- client component; `useSession` for state, `signIn('google')` / `signOut()` from `next-auth/react`; loading skeleton while session resolves
- `src/components/SessionProvider.tsx` -- thin client wrapper around `SessionProvider` from `next-auth/react`
- `src/app/layout.tsx` -- global nav (PromptOcean logo, Browse, Submit, AuthButton) + shared footer; per-page navs/footers removed from all three existing pages
- `next.config.ts` -- `images.remotePatterns` whitelists `lh3.googleusercontent.com` for Google profile photos
- `.env.example` updated with `AUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

**No separate accounts/sessions/verification_tokens tables** -- JWT strategy only; `users` table is the single source of truth.

---

## Step 6: Recipe Submission (branch: feature/submit-recipe)

- `src/actions/recipes.ts` -- `'use server'` file with `submitRecipe(prevState, formData)`:
  - Auth check via `auth()` (defense in depth, independent of middleware)
  - Extracts title, description, instructions, category, platformIds (multi-value), tagIds (multi-value)
  - Field validation with specific messages; returns `{ fieldErrors }` on failure
  - `generateSlug()`: lowercase, strip non-alphanumeric, collapse hyphens, truncate to 80 chars, append 4-char random suffix, fallback to `'recipe'`
  - Sequential inserts (neon-http does not support transactions): recipe first via `.returning({ id })`, then recipe_platforms, then recipe_tags
  - Calls `redirect('/recipes/[slug]')` on success outside the try-catch
- `src/lib/queries/recipes.ts` -- two new exports:
  - `getAllPlatforms()` -- includes `id` field (needed for form checkbox values)
  - `getAllTags()` -- returns `TagsByCategory` (`{ use_case, domain, style }` buckets)
- `src/components/SubmitRecipeForm.tsx` -- `'use client'`; `useActionState` from React 19; general error banner; field-level `FieldError` component; instructions textarea is `font-mono` with `rows={14}`; platforms as `<fieldset>` checkboxes; tags in three grouped sections (Use Case / Domain / Style) in a 2-col grid; submit button disabled + "Submitting..." during `isPending`
- `src/app/submit/page.tsx` -- server component; fetches platforms + tags in parallel; renders `SubmitRecipeForm`

---

## Step 7: AI Testing Playground (branch: feature/testing-playground)

**AI provider layer** (`src/lib/ai/providers.ts`):
- `AIResponse` type: `{ content, model, tokensUsed? }`
- `callClaude(systemPrompt, userMessage)` -- `@anthropic-ai/sdk`, model `claude-sonnet-4-20250514`, max_tokens 1024
- `callGPT(systemPrompt, userMessage)` -- `openai` SDK, model `gpt-4o`, max_tokens 1024
- `callGemini(systemPrompt, userMessage)` -- `@google/generative-ai`, model `gemini-2.5-flash`, maxOutputTokens 1024
- All three normalize errors and throw with a provider-prefixed message

**API route** (`src/app/api/test/route.ts`):
- POST handler; auth check via `auth()` (401 if no session)
- Input validation: UUID regex for `recipeId`, model allowlist (`claude|gpt|gemini`), non-empty checks for `instructions` and `testMessage`
- Metering: `ADMIN_EMAIL` env var bypass; `subscription_status === 'active'` bypass; otherwise fetches fresh `free_tests_remaining` from DB and returns 403 `{ error, requiresSubscription: true }` if exhausted
- Calls appropriate provider function, inserts into `test_history` (userId, recipeId, modelUsed, first 500 chars as responsePreview)
- Decrements `free_tests_remaining` via SQL expression for free users
- Returns `{ content, model, testsRemaining }` (`testsRemaining` is null for admin/paid)

**Test page** (`src/app/recipes/[slug]/test/page.tsx`):
- Server component; fetches recipe + session in parallel; calls `notFound()` if missing
- Queries `free_tests_remaining` from DB for free users; passes null for admin/paid
- Exports `generateMetadata`: "Test: [title] | PromptOcean"

**TestPlayground component** (`src/components/TestPlayground.tsx`):
- Client component; props: `recipe` (id, title, slug, instructions, category) + `testsRemaining: number | null`
- State: `isLoading` (bool), `lastResult` (last successful response, persists across runs), `alert` (error/paywall/unauthenticated, shown alongside lastResult, never replaces it), `testsRemaining` (local copy, decremented from API response)
- Back link to `/recipes/[slug]`
- Editable system prompt textarea (monospace, 10 rows) with inline Copy + "Reset to original" (only shown when modified)
- Test message textarea (3 rows)
- Model picker: three cards (Claude Sonnet 4 / GPT-4o / Gemini 2.5 Flash), selected card highlighted in indigo
- Run Test button disabled while loading or no message; "X free tests remaining" shown inline (hidden for null)
- Response area: spinner shown while loading above previous result; last result persists through subsequent runs; error/paywall/unauthenticated alerts stack below result

**Detail page update** (`src/app/recipes/[slug]/page.tsx`):
- "Test recipe" button converted from `<button>` to `<Link href="/recipes/[slug]/test">`

**Middleware update** (`middleware.ts`):
- Added `/recipes/:slug*/test` to the matcher (requires auth to access test page)

**Performance fix** (`src/lib/auth.ts` + `src/types/next-auth.d.ts`):
- `jwt` callback now fetches `id`, `subscriptionStatus`, `freeTestsRemaining` in one query at sign-in time and stores all three in the token
- `session` callback reads from token only -- zero DB queries per session check
- `JWT` type augmented with `subscriptionStatus` and `freeTestsRemaining`

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
├── middleware.ts               # route protection (project root, NOT src/)
├── next.config.ts
├── package.json
├── src/
│   ├── actions/
│   │   └── recipes.ts
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth]/
│   │   │   │       └── route.ts
│   │   │   └── test/
│   │   │       └── route.ts
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── recipes/
│   │   │   ├── page.tsx
│   │   │   └── [slug]/
│   │   │       ├── not-found.tsx
│   │   │       ├── page.tsx
│   │   │       └── test/
│   │   │           └── page.tsx
│   │   └── submit/
│   │       └── page.tsx
│   ├── components/
│   │   ├── AuthButton.tsx
│   │   ├── CategoryCard.tsx
│   │   ├── CopyButton.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── SearchBar.tsx
│   │   ├── SessionProvider.tsx
│   │   ├── SubmitRecipeForm.tsx
│   │   └── TestPlayground.tsx
│   ├── db/
│   │   ├── index.ts
│   │   ├── seed.ts
│   │   └── schema/
│   │       ├── index.ts
│   │       ├── platforms.ts
│   │       ├── recipe_platforms.ts
│   │       ├── recipe_tags.ts
│   │       ├── recipes.ts
│   │       ├── tags.ts
│   │       ├── test_history.ts
│   │       └── users.ts
│   ├── lib/
│   │   ├── ai/
│   │   │   └── providers.ts
│   │   ├── auth.ts
│   │   └── queries/
│   │       └── recipes.ts
│   └── types/
│       └── next-auth.d.ts
└── tsconfig.json
```

---

## Not Built Yet

- **Submit review/moderation** -- recipes submitted by users go live immediately, no review queue
- **Dashboard** -- `/dashboard` route protected but page doesn't exist yet
- **Upvoting** -- `upvotes` column exists, no UI action to increment it yet
- **Stripe / pricing** -- `stripe_customer_id` column exists on `users`; `/pricing` page linked from paywall message but not yet built
- **Admin / moderation** -- no tooling for managing recipes or users
