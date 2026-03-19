# Data Model

All tables use `pgTable` from `drizzle-orm/pg-core`. Driver: `@neondatabase/serverless`.

---

## Enums

### `subscription_status` (`src/db/schema/users.ts`)
```
'free' | 'active' | 'canceled' | 'past_due'
```

### `category` (`src/db/schema/recipes.ts`)
```
'writing' | 'coding' | 'research' | 'productivity' | 'creativity' | 'business' | 'education' | 'other'
```

### `tag_category` (`src/db/schema/tags.ts`)
```
'use_case' | 'domain' | 'style'
```

---

## Tables

### `users`
Source: `src/db/schema/users.ts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `email` | text | unique, not null |
| `name` | text | nullable |
| `image` | text | nullable |
| `subscription_status` | enum `subscription_status` | not null, default `'free'` |
| `free_tests_remaining` | integer | not null, default `2` |
| `stripe_customer_id` | text | unique, nullable |
| `created_at` | timestamp | not null, default now |
| `updated_at` | timestamp | not null, default now |

---

### `recipes`
Source: `src/db/schema/recipes.ts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `title` | text | not null |
| `slug` | text | unique, not null |
| `description` | text | not null |
| `instructions` | text | not null |
| `category` | enum `category` | not null |
| `author_id` | uuid | FK → `users.id`, nullable |
| `featured` | boolean | not null, default `false` |
| `upvotes` | integer | not null, default `0` |
| `search_vector` | tsvector | generated always as `to_tsvector('english', title \|\| description \|\| instructions)` |
| `created_at` | timestamp | not null, default now |
| `updated_at` | timestamp | not null, default now |

**Indexes:**
- `recipes_search_vector_idx` — GIN on `search_vector`
- `recipes_slug_idx` — btree on `slug`
- `recipes_category_idx` — btree on `category`
- `recipes_featured_idx` — btree on `featured`

**Notes:**
- `author_id` is nullable to allow anonymous/seeded recipes
- `search_vector` is a generated column — never set in inserts
- tsvector implemented via Drizzle `customType` since drizzle-orm has no native tsvector type

---

### `platforms`
Source: `src/db/schema/platforms.ts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `name` | text | unique, not null |
| `slug` | text | unique, not null |
| `icon_url` | text | nullable |

**Seed values:**

| name | slug |
|---|---|
| Claude Projects | claude-projects |
| ChatGPT Custom GPTs | chatgpt-custom-gpts |
| Gemini Gems | gemini-gems |

---

### `recipe_platforms`
Source: `src/db/schema/recipe_platforms.ts`

Junction table linking recipes to platforms.

| Column | Type | Constraints |
|---|---|---|
| `recipe_id` | uuid | FK → `recipes.id` ON DELETE CASCADE, not null |
| `platform_id` | uuid | FK → `platforms.id` ON DELETE CASCADE, not null |
| `platform_specific_notes` | text | nullable |

**Primary key:** composite `(recipe_id, platform_id)`

---

### `tags`
Source: `src/db/schema/tags.ts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `name` | text | unique, not null |
| `category` | enum `tag_category` | not null |

**Seed values:**

| name | category |
|---|---|
| prompt-engineering | use_case |
| code-review | use_case |
| writing-assistant | use_case |
| research | use_case |
| brainstorming | use_case |
| debugging | use_case |
| learning | use_case |
| automation | use_case |
| software-engineering | domain |
| marketing | domain |
| academia | domain |
| product-management | domain |
| design | domain |
| data-science | domain |
| legal | domain |
| finance | domain |
| concise | style |
| detailed | style |
| conversational | style |
| formal | style |
| step-by-step | style |
| socratic | style |

---

### `recipe_tags`
Source: `src/db/schema/recipe_tags.ts`

Junction table linking recipes to tags.

| Column | Type | Constraints |
|---|---|---|
| `recipe_id` | uuid | FK → `recipes.id` ON DELETE CASCADE, not null |
| `tag_id` | uuid | FK → `tags.id` ON DELETE CASCADE, not null |

**Primary key:** composite `(recipe_id, tag_id)`

---

### `test_history`
Source: `src/db/schema/test_history.ts`

| Column | Type | Constraints |
|---|---|---|
| `id` | uuid | PK, default random |
| `user_id` | uuid | FK → `users.id` ON DELETE CASCADE, not null |
| `recipe_id` | uuid | FK → `recipes.id` ON DELETE CASCADE, not null |
| `model_used` | text | not null (e.g. `'claude-sonnet-4-20250514'`, `'gpt-4o'`) |
| `response_preview` | text | nullable (first ~500 chars of response) |
| `created_at` | timestamp | not null, default now |

**Indexes:**
- `test_history_user_id_idx` — btree on `user_id`
- `test_history_recipe_id_idx` — btree on `recipe_id`

---

## Seed Recipes

All 8 seeded recipes have `author_id = null` and are linked to all 3 platforms.

| slug | category | featured | tags |
|---|---|---|---|
| senior-code-reviewer | coding | yes | code-review, software-engineering, detailed |
| explain-like-im-5 | education | yes | learning, conversational, step-by-step |
| startup-landing-page-copy | business | yes | writing-assistant, marketing, concise |
| socratic-debugging-partner | coding | no | debugging, socratic, software-engineering |
| weekly-meal-planner | productivity | no | automation, step-by-step, concise |
| technical-blog-post-writer | writing | yes | writing-assistant, software-engineering, detailed |
| product-requirement-distiller | business | no | brainstorming, product-management, formal |
| research-paper-summarizer | research | no | research, academia, detailed |

---

## Relationship Diagram

```
users ──────────────────────────────────────────── test_history
  │                                                      │
  └──< recipes >──────────────────────────────────────── ┘
            │
            ├──< recipe_platforms >── platforms
            │
            └──< recipe_tags >── tags
```

- `recipes.author_id` → `users.id` (nullable)
- `test_history.user_id` → `users.id` (cascade delete)
- `test_history.recipe_id` → `recipes.id` (cascade delete)
- `recipe_platforms.(recipe_id, platform_id)` composite PK, both cascade delete
- `recipe_tags.(recipe_id, tag_id)` composite PK, both cascade delete
