import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getRecipeBySlug } from '@/lib/queries/recipes';
import { TestPlayground } from '@/components/TestPlayground';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users } from '@/db/schema';
import { eq } from 'drizzle-orm';

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return { title: 'Recipe Not Found | PromptOcean' };
  }

  return {
    title: `Test: ${recipe.title} | PromptOcean`,
    description: `Test the "${recipe.title}" recipe against Claude, GPT-4o, or Gemini.`,
  };
}

export default async function TestPage({ params }: PageProps) {
  const { slug } = await params;
  const [recipe, session] = await Promise.all([getRecipeBySlug(slug), auth()]);

  if (!recipe) notFound();

  let testsRemaining: number | null = null;

  if (session?.user?.id) {
    const isAdmin = session.user.email === process.env.ADMIN_EMAIL;
    const isPaid = session.user.subscriptionStatus === 'active';

    if (!isAdmin && !isPaid) {
      const [row] = await db
        .select({ freeTestsRemaining: users.freeTestsRemaining })
        .from(users)
        .where(eq(users.id, session.user.id));

      testsRemaining = row?.freeTestsRemaining ?? 0;
    }
  }

  return (
    <main className="flex-1">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <TestPlayground
          recipe={{
            id: recipe.id,
            title: recipe.title,
            slug: recipe.slug,
            instructions: recipe.instructions,
            category: recipe.category,
          }}
          testsRemaining={testsRemaining}
        />
      </div>
    </main>
  );
}
