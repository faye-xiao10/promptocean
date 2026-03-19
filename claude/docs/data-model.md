# Data Model

## Enums
- subscription_status: 'free', 'active', 'canceled', 'past_due'
- recipe_category: 'writing', 'coding', 'research', 'productivity', 'creativity', 'business', 'education', 'other'
- tag_category: 'use_case', 'domain', 'style'

## Tables

### users
| Column              | Type      | Constraints                        |
|---------------------|-----------|------------------------------------|
| id                  | uuid      | PK, default random                 |
| email               | text      | unique, not null                   |
| name                | text      |                                    |
| image               | text      |                                    |
| subscription_status | enum      | default 'free'                     |
| free_tests_remaining| integer   | default 2                          |
| stripe_customer_id  | text      | unique                             |
| created_at          | timestamp | default now                        |
| updated_at          | timestamp | default now                        |

### recipes
| Column        | Type      | Constraints                              |
|---------------|-----------|------------------------------------------|
| id            | uuid      | PK, default random                       |
| title         | text      | not null                                 |
| slug          | text      | unique, not null, indexed                |
| description   | text      | not null                                 |
| instructions  | text      | not null                                 |
| category      | enum      | not null                                 |
| author_id     | uuid      | FK -> users.id, nullable                 |
| featured      | boolean   | default false, indexed                   |
| upvotes       | integer   | default 0                                |
| search_vector | tsvector  | GIN index, generated from title+desc+instructions |
| created_at    | timestamp | default now                              |
| updated_at    | timestamp | default now                              |

### platforms
| Column   | Type | Constraints            |
|----------|------|------------------------|
| id       | uuid | PK, default random     |
| name     | text | unique, not null       |
| slug     | text | unique, not null       |
| icon_url | text |                        |

Seed values: Claude Projects, ChatGPT Custom GPTs, Gemini Gems

### recipe_platforms
| Column                  | Type | Constraints                          |
|-------------------------|------|--------------------------------------|
| recipe_id               | uuid | FK -> recipes.id, cascade delete     |
| platform_id             | uuid | FK -> platforms.id, cascade delete   |
| platform_specific_notes | text |                                      |

Composite PK on (recipe_id, platform_id)

### tags
| Column   | Type | Constraints        |
|----------|------|--------------------|
| id       | uuid | PK, default random |
| name     | text | unique, not null   |
| category | enum | not null           |

### recipe_tags
| Column    | Type | Constraints                        |
|-----------|------|------------------------------------|
| recipe_id | uuid | FK -> recipes.id, cascade delete   |
| tag_id    | uuid | FK -> tags.id, cascade delete      |

Composite PK on (recipe_id, tag_id)

### test_history
| Column           | Type      | Constraints                        |
|------------------|-----------|------------------------------------|
| id               | uuid      | PK, default random                 |
| user_id          | uuid      | FK -> users.id, cascade delete, not null, indexed |
| recipe_id        | uuid      | FK -> recipes.id, cascade delete, not null, indexed |
| model_used       | text      | not null                           |
| response_preview | text      |                                    |
| created_at       | timestamp | default now                        |