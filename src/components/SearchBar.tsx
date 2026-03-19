'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useRef } from 'react';

type Props = {
  defaultValue?: string;
  placeholder?: string;
};

export function SearchBar({ defaultValue = '', placeholder = 'Search recipes...' }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const value = inputRef.current?.value.trim();
    if (value) {
      router.push(`/recipes?q=${encodeURIComponent(value)}`);
    } else {
      router.push('/recipes');
    }
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex gap-2">
      <input
        ref={inputRef}
        type="search"
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm"
      />
      <button
        type="submit"
        className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors"
      >
        Search
      </button>
    </form>
  );
}
