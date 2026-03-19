import { getFeaturedRecipes, getCategories } from '@/lib/queries/recipes';
import { RecipeCard } from '@/components/RecipeCard';
import { CategoryCard } from '@/components/CategoryCard';
import { SearchBar } from '@/components/SearchBar';
import Link from 'next/link';

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedRecipes(),
    getCategories(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Nav */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-bold text-gray-900 text-lg">
            PromptOcean
          </Link>
          <nav className="flex items-center gap-6 text-sm text-gray-600">
            <Link href="/recipes" className="hover:text-gray-900 transition-colors">
              Browse
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-4 tracking-tight">
            Find the perfect AI recipe
          </h1>
          <p className="text-xl text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Discover battle-tested system prompts for Claude, ChatGPT, and Gemini.
            Copy, adapt, and make them your own.
          </p>
          <div className="max-w-lg mx-auto">
            <SearchBar placeholder="Search prompts, e.g. code review..." />
          </div>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-14 flex-1 w-full">
        {/* Featured recipes */}
        {featured.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">Featured Recipes</h2>
              <Link
                href="/recipes"
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
              >
                View all
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featured.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          </section>
        )}

        {/* Browse by category */}
        {categories.length > 0 && (
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {categories.map(({ category, count }) => (
                <CategoryCard key={category} category={category} count={count} />
              ))}
            </div>
          </section>
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
