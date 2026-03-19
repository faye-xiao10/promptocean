import { pgTable, uuid, primaryKey } from 'drizzle-orm/pg-core';
import { recipes } from './recipes';
import { tags } from './tags';

export const recipeTags = pgTable(
  'recipe_tags',
  {
    recipeId: uuid('recipe_id')
      .references(() => recipes.id, { onDelete: 'cascade' })
      .notNull(),
    tagId: uuid('tag_id')
      .references(() => tags.id, { onDelete: 'cascade' })
      .notNull(),
  },
  (table) => [primaryKey({ columns: [table.recipeId, table.tagId] })]
);

export type RecipeTag = typeof recipeTags.$inferSelect;
export type NewRecipeTag = typeof recipeTags.$inferInsert;
