import { pgTable, uuid, text, pgEnum } from 'drizzle-orm/pg-core';

export const tagCategoryEnum = pgEnum('tag_category', ['use_case', 'domain', 'style']);

export const tags = pgTable('tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').unique().notNull(),
  category: tagCategoryEnum('category').notNull(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
