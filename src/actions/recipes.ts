'use server';

import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { recipes, recipePlatforms, recipeTags } from '@/db/schema';

export type SubmitRecipeState = {
  generalError?: string;
  fieldErrors?: {
    title?: string;
    description?: string;
    instructions?: string;
    category?: string;
    platforms?: string;
  };
} | null;

const VALID_CATEGORIES = [
  'writing',
  'coding',
  'research',
  'productivity',
  'creativity',
  'business',
  'education',
  'other',
] as const;

type RecipeCategory = (typeof VALID_CATEGORIES)[number];

function generateSlug(title: string): string {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80) || 'recipe';

  const suffix = Math.random().toString(36).slice(2, 6);
  return `${base}-${suffix}`;
}

export async function submitRecipe(
  _prevState: SubmitRecipeState,
  formData: FormData
): Promise<SubmitRecipeState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { generalError: 'You must be signed in to submit a recipe.' };
  }
  const userId = session.user.id;

  const title = ((formData.get('title') as string) ?? '').trim();
  const description = ((formData.get('description') as string) ?? '').trim();
  const instructions = ((formData.get('instructions') as string) ?? '').trim();
  const category = (formData.get('category') as string) ?? '';
  const platformIds = formData.getAll('platformIds') as string[];
  const tagIds = formData.getAll('tagIds') as string[];

  // Validate
  const fieldErrors: NonNullable<SubmitRecipeState>['fieldErrors'] = {};

  if (!title) {
    fieldErrors.title = 'Title is required.';
  } else if (title.length > 200) {
    fieldErrors.title = 'Title must be 200 characters or fewer.';
  }

  if (!description) {
    fieldErrors.description = 'Description is required.';
  } else if (description.length > 500) {
    fieldErrors.description = 'Description must be 500 characters or fewer.';
  }

  if (!instructions) {
    fieldErrors.instructions = 'Instructions are required.';
  } else if (instructions.length > 10000) {
    fieldErrors.instructions = 'Instructions must be 10,000 characters or fewer.';
  }

  if (!category || !VALID_CATEGORIES.includes(category as RecipeCategory)) {
    fieldErrors.category = 'Please select a category.';
  }

  if (platformIds.length === 0) {
    fieldErrors.platforms = 'Select at least one platform.';
  }

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const slug = generateSlug(title);

  try {
    const [recipe] = await db
      .insert(recipes)
      .values({
        title,
        description,
        instructions,
        category: category as RecipeCategory,
        slug,
        authorId: userId,
      })
      .returning({ id: recipes.id });

    await db.insert(recipePlatforms).values(
      platformIds.map((platformId) => ({ recipeId: recipe.id, platformId }))
    );

    if (tagIds.length > 0) {
      await db.insert(recipeTags).values(
        tagIds.map((tagId) => ({ recipeId: recipe.id, tagId }))
      );
    }
  } catch (err) {
    console.error('Recipe submission failed:', err);
    return { generalError: 'Something went wrong. Please try again.' };
  }

  redirect(`/recipes/${slug}`);
}
