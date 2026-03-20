import { db } from '@/db';
import { recipes, platforms, tags, recipePlatforms, recipeTags, users } from '@/db/schema';
import { eq, and, desc, inArray, sql, ne } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type RecipeWithRelations = typeof recipes.$inferSelect & {
  platforms: { name: string; slug: string }[];
  tags: { name: string; category: string }[];
};

export type RecipeDetail = typeof recipes.$inferSelect & {
  platforms: { name: string; slug: string; platformSpecificNotes: string | null }[];
  tags: { name: string; category: string }[];
  authorName: string | null;
};

export type CategoryCount = {
  category: string;
  count: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function attachRelations(
  recipeRows: (typeof recipes.$inferSelect)[]
): Promise<RecipeWithRelations[]> {
  if (recipeRows.length === 0) return [];

  const ids = recipeRows.map((r) => r.id);

  const [platformRows, tagRows] = await Promise.all([
    db
      .select({
        recipeId: recipePlatforms.recipeId,
        name: platforms.name,
        slug: platforms.slug,
      })
      .from(recipePlatforms)
      .innerJoin(platforms, eq(recipePlatforms.platformId, platforms.id))
      .where(inArray(recipePlatforms.recipeId, ids)),

    db
      .select({
        recipeId: recipeTags.recipeId,
        name: tags.name,
        category: tags.category,
      })
      .from(recipeTags)
      .innerJoin(tags, eq(recipeTags.tagId, tags.id))
      .where(inArray(recipeTags.recipeId, ids)),
  ]);

  const platformsByRecipe = new Map<string, { name: string; slug: string }[]>();
  const tagsByRecipe = new Map<string, { name: string; category: string }[]>();

  for (const row of platformRows) {
    if (!platformsByRecipe.has(row.recipeId)) platformsByRecipe.set(row.recipeId, []);
    platformsByRecipe.get(row.recipeId)!.push({ name: row.name, slug: row.slug });
  }

  for (const row of tagRows) {
    if (!tagsByRecipe.has(row.recipeId)) tagsByRecipe.set(row.recipeId, []);
    tagsByRecipe.get(row.recipeId)!.push({ name: row.name, category: row.category });
  }

  return recipeRows.map((recipe) => ({
    ...recipe,
    platforms: platformsByRecipe.get(recipe.id) ?? [],
    tags: tagsByRecipe.get(recipe.id) ?? [],
  }));
}

function buildTsQuery(input: string): string {
  return input
    .trim()
    .split(/\s+/)
    .map((term) => term.replace(/[^a-zA-Z0-9]/g, ''))
    .filter(Boolean)
    .join(' & ');
}

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export async function getFeaturedRecipes(): Promise<RecipeWithRelations[]> {
  const rows = await db
    .select()
    .from(recipes)
    .where(eq(recipes.featured, true))
    .orderBy(desc(recipes.createdAt));

  return attachRelations(rows);
}

export async function getCategories(): Promise<CategoryCount[]> {
  const rows = await db
    .select({
      category: recipes.category,
      count: sql<number>`count(*)::int`,
    })
    .from(recipes)
    .groupBy(recipes.category)
    .orderBy(sql`count(*) desc`);

  return rows.map((r) => ({ category: r.category, count: r.count }));
}

export async function getPlatforms(): Promise<{ name: string; slug: string }[]> {
  return db
    .select({ name: platforms.name, slug: platforms.slug })
    .from(platforms)
    .orderBy(platforms.name);
}

export async function getAllPlatforms(): Promise<{ id: string; name: string; slug: string }[]> {
  return db
    .select({ id: platforms.id, name: platforms.name, slug: platforms.slug })
    .from(platforms)
    .orderBy(platforms.name);
}

export type TagsByCategory = {
  use_case: { id: string; name: string }[];
  domain: { id: string; name: string }[];
  style: { id: string; name: string }[];
};

export async function getAllTags(): Promise<TagsByCategory> {
  const rows = await db
    .select({ id: tags.id, name: tags.name, category: tags.category })
    .from(tags)
    .orderBy(tags.name);

  return {
    use_case: rows.filter((t) => t.category === 'use_case').map(({ id, name }) => ({ id, name })),
    domain: rows.filter((t) => t.category === 'domain').map(({ id, name }) => ({ id, name })),
    style: rows.filter((t) => t.category === 'style').map(({ id, name }) => ({ id, name })),
  };
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

type SearchParams = {
  query?: string;
  category?: string;
  platform?: string;
  tags?: string[];
};

export async function searchRecipes(params: SearchParams): Promise<RecipeWithRelations[]> {
  const { query, category, platform, tags: tagFilters } = params;

  const tsQueryStr = query ? buildTsQuery(query) : null;
  const conditions = [];

  if (tsQueryStr) {
    conditions.push(
      sql`${recipes.searchVector} @@ to_tsquery('english', ${tsQueryStr})`
    );
  }

  if (category) {
    conditions.push(sql`${recipes.category} = ${category}`);
  }

  if (platform) {
    conditions.push(
      inArray(
        recipes.id,
        db
          .select({ id: recipePlatforms.recipeId })
          .from(recipePlatforms)
          .innerJoin(platforms, eq(recipePlatforms.platformId, platforms.id))
          .where(eq(platforms.slug, platform))
      )
    );
  }

  if (tagFilters && tagFilters.length > 0) {
    for (const tagName of tagFilters) {
      conditions.push(
        inArray(
          recipes.id,
          db
            .select({ id: recipeTags.recipeId })
            .from(recipeTags)
            .innerJoin(tags, eq(recipeTags.tagId, tags.id))
            .where(eq(tags.name, tagName))
        )
      );
    }
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  let rows: (typeof recipes.$inferSelect)[];

  if (tsQueryStr) {
    rows = await db
      .select()
      .from(recipes)
      .where(whereClause)
      .orderBy(
        sql`ts_rank(${recipes.searchVector}, to_tsquery('english', ${tsQueryStr})) desc`
      );
  } else {
    rows = await db
      .select()
      .from(recipes)
      .where(whereClause)
      .orderBy(desc(recipes.upvotes), desc(recipes.createdAt));
  }

  return attachRelations(rows);
}

// ---------------------------------------------------------------------------
// Detail
// ---------------------------------------------------------------------------

export async function getRecipeBySlug(slug: string): Promise<RecipeDetail | null> {
  const rows = await db
    .select({ recipe: recipes, authorName: users.name })
    .from(recipes)
    .leftJoin(users, eq(recipes.authorId, users.id))
    .where(eq(recipes.slug, slug));

  if (rows.length === 0) return null;

  const { recipe, authorName } = rows[0];

  const [platformRows, tagRows] = await Promise.all([
    db
      .select({
        name: platforms.name,
        slug: platforms.slug,
        platformSpecificNotes: recipePlatforms.platformSpecificNotes,
      })
      .from(recipePlatforms)
      .innerJoin(platforms, eq(recipePlatforms.platformId, platforms.id))
      .where(eq(recipePlatforms.recipeId, recipe.id)),

    db
      .select({ name: tags.name, category: tags.category })
      .from(recipeTags)
      .innerJoin(tags, eq(recipeTags.tagId, tags.id))
      .where(eq(recipeTags.recipeId, recipe.id)),
  ]);

  return {
    ...recipe,
    platforms: platformRows,
    tags: tagRows,
    authorName: authorName ?? null,
  };
}

export async function getRelatedRecipes(
  recipeId: string,
  category: string,
  limit = 3
): Promise<RecipeWithRelations[]> {
  const rows = await db
    .select()
    .from(recipes)
    .where(and(sql`${recipes.category} = ${category}`, ne(recipes.id, recipeId)))
    .orderBy(desc(recipes.upvotes))
    .limit(limit);

  return attachRelations(rows);
}
