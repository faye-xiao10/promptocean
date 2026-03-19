'use client';

import { useState } from 'react';

type State = 'idle' | 'copied' | 'error';

export function CopyButton({ text }: { text: string }) {
  const [state, setState] = useState<State>('idle');

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text);
      setState('copied');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 2000);
    }
  }

  const label = state === 'copied' ? 'Copied!' : state === 'error' ? 'Failed' : 'Copy';

  const colorClass =
    state === 'copied'
      ? 'bg-green-50 text-green-700 border-green-200'
      : state === 'error'
        ? 'bg-red-50 text-red-700 border-red-200'
        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 hover:text-gray-900';

  return (
    <button
      onClick={handleCopy}
      className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors ${colorClass}`}
    >
      {label}
    </button>
  );
}
