import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  pgEnum,
  index,
  customType,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import { users } from './users';

export const categoryEnum = pgEnum('category', [
  'writing',
  'coding',
  'research',
  'productivity',
  'creativity',
  'business',
  'education',
  'other',
]);

const tsvector = customType<{ data: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const recipes = pgTable(
  'recipes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    title: text('title').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description').notNull(),
    instructions: text('instructions').notNull(),
    category: categoryEnum('category').notNull(),
    authorId: uuid('author_id').references(() => users.id),
    featured: boolean('featured').default(false).notNull(),
    upvotes: integer('upvotes').default(0).notNull(),
    searchVector: tsvector('search_vector').generatedAlwaysAs(
      sql`to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(instructions, ''))`
    ),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('recipes_search_vector_idx').using('gin', table.searchVector),
    index('recipes_slug_idx').on(table.slug),
    index('recipes_category_idx').on(table.category),
    index('recipes_featured_idx').on(table.featured),
  ]
);

export type Recipe = typeof recipes.$inferSelect;
export type NewRecipe = typeof recipes.$inferInsert;
