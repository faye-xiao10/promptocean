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
│   ├── app/                    # default Next.js app scaffold
│   │   ├── favicon.ico
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   └── db/
│       ├── index.ts            # drizzle instance (neon-http)
│       ├── seed.ts
│       ├── migrations/         # empty until db:push runs
│       └── schema/
│           ├── index.ts        # barrel export
│           ├── users.ts
│           ├── recipes.ts
│           ├── platforms.ts
│           ├── recipe_platforms.ts
│           ├── tags.ts
│           ├── recipe_tags.ts
│           └── test_history.ts
├── tsconfig.json
└── ...
```

---

## Not Built Yet

- **Auth** — no Auth.js / NextAuth setup; `users` table is schema-only
- **UI / Pages** — only the default Next.js scaffold page exists
- **API routes** — no route handlers yet
- **Stripe** — `stripe_customer_id` column exists on `users`, nothing else
- **Recipe testing UI** — the feature that consumes `test_history`
- **Search** — `search_vector` tsvector column is in place, no query layer yet
- **Admin / moderation** — no tooling for managing recipes or users
