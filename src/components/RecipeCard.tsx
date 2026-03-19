import Link from 'next/link';
import type { RecipeWithRelations } from '@/lib/queries/recipes';

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

type Props = {
  recipe: RecipeWithRelations;
};

export function RecipeCard({ recipe }: Props) {
  const colorClass = categoryColors[recipe.category] ?? categoryColors.other;

  return (
    <article className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3 hover:border-gray-300 hover:shadow-sm transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Link
          href={`/recipes/${recipe.slug}`}
          className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors leading-snug line-clamp-2"
        >
          {recipe.title}
        </Link>
        <span
          className={`shrink-0 text-xs font-medium px-2 py-0.5 rounded-full capitalize ${colorClass}`}
        >
          {recipe.category}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed">
        {recipe.description}
      </p>

      {/* Platforms */}
      {recipe.platforms.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {recipe.platforms.map((platform) => (
            <span
              key={platform.slug}
              className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
            >
              {platform.name}
            </span>
          ))}
        </div>
      )}

      {/* Tags + upvotes row */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-1">
        <div className="flex flex-wrap gap-1">
          {recipe.tags.slice(0, 3).map((tag) => (
            <span
              key={tag.name}
              className="text-xs px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-full"
            >
              {tag.name}
            </span>
          ))}
        </div>
        <span className="shrink-0 text-xs text-gray-400 font-medium">
          {recipe.upvotes} votes
        </span>
      </div>
    </article>
  );
}
