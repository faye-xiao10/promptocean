'use client';

import { useActionState } from 'react';
import { submitRecipe, type SubmitRecipeState } from '@/actions/recipes';
import type { TagsByCategory } from '@/lib/queries/recipes';

const CATEGORIES = [
  { value: 'writing', label: 'Writing' },
  { value: 'coding', label: 'Coding' },
  { value: 'research', label: 'Research' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'creativity', label: 'Creativity' },
  { value: 'business', label: 'Business' },
  { value: 'education', label: 'Education' },
  { value: 'other', label: 'Other' },
];

const TAG_CATEGORY_LABELS: Record<keyof TagsByCategory, string> = {
  use_case: 'Use Case',
  domain: 'Domain',
  style: 'Style',
};

type Platform = { id: string; name: string; slug: string };

type Props = {
  platforms: Platform[];
  tagsByCategory: TagsByCategory;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-sm text-red-600">{message}</p>;
}

export function SubmitRecipeForm({ platforms, tagsByCategory }: Props) {
  const [state, formAction, isPending] = useActionState<SubmitRecipeState, FormData>(
    submitRecipe,
    null
  );

  return (
    <form action={formAction} className="space-y-8">
      {/* General error */}
      {state?.generalError && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.generalError}
        </div>
      )}

      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-900 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          maxLength={200}
          placeholder="e.g. Senior Code Reviewer"
          aria-describedby={state?.fieldErrors?.title ? 'title-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
        <FieldError message={state?.fieldErrors?.title} />
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-900 mb-1.5">
          Description <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-1.5">
          A short summary of what this recipe does. Max 500 characters.
        </p>
        <textarea
          id="description"
          name="description"
          rows={3}
          maxLength={500}
          placeholder="Explain what this prompt does and when someone would use it."
          aria-describedby={state?.fieldErrors?.description ? 'description-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
        <FieldError message={state?.fieldErrors?.description} />
      </div>

      {/* Instructions */}
      <div>
        <label htmlFor="instructions" className="block text-sm font-medium text-gray-900 mb-1.5">
          Instructions <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-1.5">
          The actual prompt text people will copy and use. Max 10,000 characters.
        </p>
        <textarea
          id="instructions"
          name="instructions"
          rows={14}
          maxLength={10000}
          placeholder="You are a..."
          aria-describedby={state?.fieldErrors?.instructions ? 'instructions-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
        <FieldError message={state?.fieldErrors?.instructions} />
      </div>

      {/* Category */}
      <div>
        <label htmlFor="category" className="block text-sm font-medium text-gray-900 mb-1.5">
          Category <span className="text-red-500">*</span>
        </label>
        <select
          id="category"
          name="category"
          defaultValue=""
          aria-describedby={state?.fieldErrors?.category ? 'category-error' : undefined}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
        >
          <option value="" disabled>
            Select a category
          </option>
          {CATEGORIES.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <FieldError message={state?.fieldErrors?.category} />
      </div>

      {/* Platforms */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-900 mb-1.5">
          Platforms <span className="text-red-500">*</span>
        </legend>
        <p className="text-xs text-gray-500 mb-3">Select all platforms this recipe works on.</p>
        <div className="flex flex-col gap-2">
          {platforms.map((platform) => (
            <label key={platform.id} className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                name="platformIds"
                value={platform.id}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span className="text-sm text-gray-700">{platform.name}</span>
            </label>
          ))}
        </div>
        <FieldError message={state?.fieldErrors?.platforms} />
      </fieldset>

      {/* Tags */}
      <fieldset>
        <legend className="block text-sm font-medium text-gray-900 mb-1.5">Tags</legend>
        <p className="text-xs text-gray-500 mb-4">Optional. Select any that apply.</p>
        <div className="space-y-5">
          {(Object.keys(tagsByCategory) as (keyof TagsByCategory)[]).map((cat) => (
            <div key={cat}>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {TAG_CATEGORY_LABELS[cat]}
              </p>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {tagsByCategory[cat].map((tag) => (
                  <label key={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="tagIds"
                      value={tag.id}
                      className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-700">{tag.name}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </fieldset>

      {/* Submit */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="w-full sm:w-auto px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isPending ? 'Submitting...' : 'Submit Recipe'}
        </button>
      </div>
    </form>
  );
}
