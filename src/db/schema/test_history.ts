import { pgTable, uuid, text, timestamp, index } from 'drizzle-orm/pg-core';
import { users } from './users';
import { recipes } from './recipes';

export const testHistory = pgTable(
  'test_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    modelUsed: text('model_used').notNull(),
    responsePreview: text('response_preview'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('test_history_user_id_idx').on(table.userId),
    index('test_history_recipe_id_idx').on(table.recipeId),
  ]
);

export type TestHistory = typeof testHistory.$inferSelect;
export type NewTestHistory = typeof testHistory.$inferInsert;
