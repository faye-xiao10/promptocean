import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { getRecipeBySlug, getRelatedRecipes } from '@/lib/queries/recipes';
import { RecipeCard } from '@/components/RecipeCard';
import { CopyButton } from '@/components/CopyButton';

type PageProps = {
  params: Promise<{ slug: string }>;
};

const categoryColors: Record<string, string> = {
  writing: 'bg-blue-100 text-blue-700',
  coding: 'bg-violet-100 text-violet-700',
  research: 'bg-amber-100 text-amber-700',
  productivity: 'bg-emerald-100 text-emerald-700',
  creativity: 'bg-pink-100 text-pink-700',
  business: 'bg-orange-100 text-orange-700',
  education: 'bg-cyan-100 text-cyan-700',
  other: 'bg-gray-100 text-gray-600',
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) {
    return { title: 'Recipe Not Found | PromptOcean' };
  }

  return {
    title: `${recipe.title} | PromptOcean`,
    description: recipe.description,
    openGraph: {
      title: recipe.title,
      description: recipe.description,
    },
  };
}

export default async function RecipeDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const recipe = await getRecipeBySlug(slug);

  if (!recipe) notFound();

  const relatedRecipes = await getRelatedRecipes(recipe.id, recipe.category);

  const colorClass = categoryColors[recipe.category] ?? categoryColors.other;
  const hasNotes = recipe.platforms.some((p) => p.platformSpecificNotes);
  const categoryLabel = recipe.category.charAt(0).toUpperCase() + recipe.category.slice(1);

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex items-center flex-wrap gap-x-2 gap-y-1 text-sm text-gray-500">
            <li>
              <Link href="/" className="hover:text-gray-900 transition-colors">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/recipes" className="hover:text-gray-900 transition-colors">
                Recipes
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link
                href={`/recipes?category=${recipe.category}`}
                className="hover:text-gray-900 transition-colors capitalize"
              >
                {categoryLabel}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li className="text-gray-900 truncate max-w-[200px]" aria-current="page">
              {recipe.title}
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start gap-3 mb-4">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight flex-1">
              {recipe.title}
            </h1>
            <span
              className={`shrink-0 mt-1 text-sm font-medium px-2.5 py-1 rounded-full capitalize ${colorClass}`}
            >
              {recipe.category}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.platforms.map((p) => (
              <span
                key={p.slug}
                className="text-xs px-2.5 py-1 bg-gray-100 text-gray-600 rounded-full"
              >
                {p.name}
              </span>
            ))}
            {recipe.tags.map((t) => (
              <span
                key={t.name}
                className="text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-full"
              >
                {t.name}
              </span>
            ))}
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>{recipe.upvotes} votes</span>
            <span>By {recipe.authorName ?? 'Community'}</span>
          </div>
        </div>

        {/* Description */}
        <section className="mb-8">
          <p className="text-gray-700 leading-relaxed text-base">{recipe.description}</p>
        </section>

        {/* Instructions */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-gray-900">Instructions</h2>
            <CopyButton text={recipe.instructions} />
          </div>
          <div className="rounded-xl bg-gray-50 border border-gray-200 p-6">
            <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
              {recipe.instructions}
            </p>
          </div>
        </section>

        {/* Platform-specific notes */}
        {hasNotes && (
          <section className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Platform Notes</h2>
            <div className="flex flex-col gap-3">
              {recipe.platforms
                .filter((p) => p.platformSpecificNotes)
                .map((p) => (
                  <div key={p.slug} className="rounded-xl border border-gray-200 bg-white p-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      {p.name}
                    </p>
                    <p className="text-sm text-gray-700">{p.platformSpecificNotes}</p>
                  </div>
                ))}
            </div>
          </section>
        )}

        {/* Test CTA */}
        <section className="mb-10">
          <div className="rounded-xl bg-indigo-50 border border-indigo-200 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-indigo-900 mb-1">Test this recipe</h2>
              <p className="text-sm text-indigo-700">
                Try it against Claude, GPT-4o, or Gemini and compare results side by side.
              </p>
            </div>
            <button className="shrink-0 px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors">
              Test recipe
            </button>
          </div>
        </section>
      </div>

      {/* Related recipes */}
      {relatedRecipes.length > 0 && (
        <section className="border-t border-gray-200 bg-white py-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">
              More {categoryLabel} Recipes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedRecipes.map((r) => (
                <RecipeCard key={r.id} recipe={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
