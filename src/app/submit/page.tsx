import type { Metadata } from 'next';
import { getAllPlatforms, getAllTags } from '@/lib/queries/recipes';
import { SubmitRecipeForm } from '@/components/SubmitRecipeForm';

export const metadata: Metadata = {
  title: 'Submit a Recipe | PromptOcean',
  description: 'Share a prompt that works well for you.',
};

export default async function SubmitPage() {
  const [platforms, tagsByCategory] = await Promise.all([getAllPlatforms(), getAllTags()]);

  return (
    <main className="flex-1">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit a Recipe</h1>
          <p className="text-gray-500">
            Share a prompt that works well for you. All submissions are reviewed before going live.
          </p>
        </div>
        <SubmitRecipeForm platforms={platforms} tagsByCategory={tagsByCategory} />
      </div>
    </main>
  );
}
