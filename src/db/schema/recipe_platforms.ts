import { pgTable, uuid, text, primaryKey } from 'drizzle-orm/pg-core';
import { recipes } from './recipes';
import { platforms } from './platforms';

export const recipePlatforms = pgTable(
  'recipe_platforms',
  {
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    platformId: uuid('platform_id')
      .references(() => platforms.id, { onDelete: 'cascade' })
      .notNull(),
    platformSpecificNotes: text('platform_specific_notes'),
  },
  (table) => [primaryKey({ columns: [table.recipeId, table.platformId] })]
);

export type RecipePlatform = typeof recipePlatforms.$inferSelect;
export type NewRecipePlatform = typeof recipePlatforms.$inferInsert;
