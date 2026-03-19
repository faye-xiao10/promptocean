import { searchRecipes, getCategories, getPlatforms } from '@/lib/queries/recipes';
import { RecipeCard } from '@/components/RecipeCard';
import { SearchBar } from '@/components/SearchBar';
import Link from 'next/link';

type PageProps = {
  searchParams: Promise<{
    q?: string;
    category?: string;
    platform?: string;
    tags?: string;
  }>;
};

// Build a /recipes URL, merging base params with overrides.
// Pass undefined as a value to remove that key.
function buildUrl(
  base: Record<string, string>,
  overrides: Record<string, string | undefined>
): string {
  const merged: Record<string, string> = { ...base };
  for (const [key, val] of Object.entries(overrides)) {
    if (val === undefined) {
      delete merged[key];
    } else {
      merged[key] = val;
    }
  }
  const qs = new URLSearchParams(merged).toString();
  return `/recipes${qs ? `?${qs}` : ''}`;
}

export default async function RecipesPage({ searchParams }: PageProps) {
  const { q, category, platform, tags } = await searchParams;

  const tagArray = tags ? tags.split(',').filter(Boolean) : undefined;

  const [results, categories, allPlatforms] = await Promise.all([
    searchRecipes({ query: q, category, platform, tags: tagArray }),
    getCategories(),
    getPlatforms(),
  ]);

  // Current params for building filter URLs
  const currentParams: Record<string, string> = {};
  if (q) currentParams.q = q;
  if (category) currentParams.category = category;
  if (platform) currentParams.platform = platform;

  const hasActiveFilters = !!(q || category || platform);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900 text-lg">
            PromptOcean
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/recipes" className="hover:text-gray-900 transition-colors font-medium text-gray-900">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 flex-1 w-full">
        {/* Search bar */}
        <div className="mb-8 max-w-xl">
          <SearchBar defaultValue={q ?? ''} placeholder="Search recipes..." />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-6 mb-8">
          {/* Category filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Category
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildUrl(currentParams, { category: undefined })}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  !category
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                All
              </Link>
              {categories.map(({ category: cat }) => {
                const isActive = category === cat;
                return (
                  <Link
                    key={cat}
                    href={buildUrl(currentParams, {
                      category: isActive ? undefined : cat,
                    })}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors capitalize ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {cat}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Platform filter */}
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
              Platform
            </p>
            <div className="flex flex-wrap gap-2">
              <Link
                href={buildUrl(currentParams, { platform: undefined })}
                className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                  !platform
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                }`}
              >
                All
              </Link>
              {allPlatforms.map((p) => {
                const isActive = platform === p.slug;
                return (
                  <Link
                    key={p.slug}
                    href={buildUrl(currentParams, {
                      platform: isActive ? undefined : p.slug,
                    })}
                    className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                      isActive
                        ? 'bg-indigo-600 text-white border-indigo-600'
                        : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {p.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active filter summary + clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-3 mb-6 text-sm text-gray-600">
            <span>
              {results.length} {results.length === 1 ? 'result' : 'results'}
              {q && (
                <>
                  {' '}for <span className="font-medium text-gray-900">&quot;{q}&quot;</span>
                </>
              )}
            </span>
            <Link
              href="/recipes"
              className="text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
            >
              Clear filters
            </Link>
          </div>
        )}

        {/* Results grid */}
        {results.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        ) : (
          /* Empty state */
          <div className="text-center py-24">
            <p className="text-4xl mb-4">🔍</p>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">No recipes found</h2>
            <p className="text-gray-500 mb-6 max-w-sm mx-auto">
              Try broader search terms, a different category, or{' '}
              <Link href="/recipes" className="text-indigo-600 hover:text-indigo-700 font-medium">
                browse all recipes
              </Link>
              .
            </p>
          </div>
        )}
      </main>

      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between text-sm text-gray-500">
          <span className="font-semibold text-gray-900">PromptOcean</span>
          <nav className="flex gap-6">
            <Link href="/recipes" className="hover:text-gray-900 transition-colors">
              Browse
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
