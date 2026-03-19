import Link from 'next/link';

const categoryEmojis: Record<string, string> = {
  writing: '✍️',
  coding: '💻',
  research: '🔬',
  productivity: '⚡',
  creativity: '🎨',
  business: '💼',
  education: '📚',
  other: '🔮',
};

type Props = {
  category: string;
  count: number;
};

export function CategoryCard({ category, count }: Props) {
  const emoji = categoryEmojis[category] ?? categoryEmojis.other;
  const label = category.charAt(0).toUpperCase() + category.slice(1);

  return (
    <Link
      href={`/recipes?category=${encodeURIComponent(category)}`}
      className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-2 hover:border-indigo-300 hover:shadow-sm transition-all group"
    >
      <span className="text-2xl">{emoji}</span>
      <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
        {label}
      </span>
      <span className="text-sm text-gray-500">
        {count} {count === 1 ? 'recipe' : 'recipes'}
      </span>
    </Link>
  );
}
