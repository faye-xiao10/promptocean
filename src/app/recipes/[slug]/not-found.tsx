import Link from 'next/link';

export default function RecipeNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
      <p className="text-5xl mb-6">🌊</p>
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">Recipe not found</h1>
      <p className="text-gray-500 mb-8 max-w-sm">
        This recipe may have been moved or removed. Try browsing all recipes to find what you need.
      </p>
      <Link
        href="/recipes"
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        Browse all recipes
      </Link>
    </div>
  );
}
