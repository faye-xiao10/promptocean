'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';

type Recipe = {
  id: string;
  title: string;
  slug: string;
  instructions: string;
  category: string;
};

type ModelKey = 'claude' | 'gpt' | 'gemini';

const MODELS: { key: ModelKey; label: string; sublabel: string }[] = [
  { key: 'claude', label: 'Claude', sublabel: 'Sonnet 4' },
  { key: 'gpt', label: 'GPT-4o', sublabel: 'OpenAI' },
  { key: 'gemini', label: 'Gemini', sublabel: '2.5 Flash' },
];

type LastResult = { content: string; model: string };

type AlertState =
  | { type: 'error'; message: string }
  | { type: 'paywall' }
  | { type: 'unauthenticated' }
  | null;

type CopyState = 'idle' | 'copied' | 'error';

function InlineCopyButton({ text }: { text: string }) {
  const [state, setState] = useState<CopyState>('idle');

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

export function TestPlayground({
  recipe,
  testsRemaining: initialTestsRemaining,
}: {
  recipe: Recipe;
  testsRemaining: number | null;
}) {
  const { status: sessionStatus } = useSession();
  const [instructions, setInstructions] = useState(recipe.instructions);
  const [testMessage, setTestMessage] = useState('');
  const [selectedModel, setSelectedModel] = useState<ModelKey>('claude');
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<LastResult | null>(null);
  const [alert, setAlert] = useState<AlertState>(null);
  const [testsRemaining, setTestsRemaining] = useState<number | null>(initialTestsRemaining);

  const canRun = testMessage.trim().length > 0 && !isLoading;

  async function handleRunTest() {
    setIsLoading(true);
    setAlert(null);

    try {
      const res = await fetch('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipeId: recipe.id,
          model: selectedModel,
          instructions: instructions.trim(),
          testMessage: testMessage.trim(),
        }),
      });

      if (res.status === 401) {
        setAlert({ type: 'unauthenticated' });
        return;
      }

      if (res.status === 403) {
        setAlert({ type: 'paywall' });
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setAlert({ type: 'error', message: data.error ?? 'Something went wrong.' });
        return;
      }

      setLastResult({ content: data.content, model: data.model });

      if (data.testsRemaining !== null) {
        setTestsRemaining(data.testsRemaining);
      }
    } catch {
      setAlert({ type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Back link */}
      <Link
        href={`/recipes/${recipe.slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to recipe
      </Link>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Test: {recipe.title}</h1>
      </div>

      {/* Editable system prompt */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label htmlFor="instructions" className="block text-sm font-medium text-gray-900">
            System Prompt (edit to tweak)
          </label>
          <div className="flex items-center gap-2">
            <InlineCopyButton text={instructions} />
            {instructions !== recipe.instructions && (
              <button
                onClick={() => setInstructions(recipe.instructions)}
                className="text-xs font-medium px-3 py-1.5 rounded-lg border border-gray-300 bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
              >
                Reset to original
              </button>
            )}
          </div>
        </div>
        <textarea
          id="instructions"
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          rows={10}
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Test message */}
      <div>
        <label htmlFor="testMessage" className="block text-sm font-medium text-gray-900 mb-2">
          Your test message
        </label>
        <textarea
          id="testMessage"
          value={testMessage}
          onChange={(e) => setTestMessage(e.target.value)}
          rows={3}
          placeholder="Type a message to test this recipe..."
          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-y"
        />
      </div>

      {/* Model picker */}
      <div>
        <p className="text-sm font-medium text-gray-900 mb-3">Model</p>
        <div className="flex gap-3 flex-wrap">
          {MODELS.map(({ key, label, sublabel }) => (
            <button
              key={key}
              onClick={() => setSelectedModel(key)}
              className={`flex flex-col items-center px-5 py-3 rounded-xl border-2 text-sm font-medium transition-colors min-w-[90px] ${
                selectedModel === key
                  ? 'border-indigo-600 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="font-semibold">{label}</span>
              <span className={`text-xs mt-0.5 ${selectedModel === key ? 'text-indigo-500' : 'text-gray-400'}`}>
                {sublabel}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Run button */}
      <div className="flex items-center gap-4">
        <button
          onClick={handleRunTest}
          disabled={!canRun}
          className="px-8 py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Running...' : 'Run Test'}
        </button>
        {testsRemaining !== null && (
          <span className="text-sm text-gray-500">
            {testsRemaining} free {testsRemaining === 1 ? 'test' : 'tests'} remaining
          </span>
        )}
      </div>

      {/* Response area */}
      {(isLoading || lastResult || alert) && (
        <div className="space-y-4">
          {/* Loading indicator */}
          {isLoading && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 flex items-center gap-3">
              <svg
                className="w-4 h-4 animate-spin text-indigo-600 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
              <span className="text-sm text-gray-600">Thinking...</span>
            </div>
          )}

          {/* Last successful result -- persists across runs */}
          {lastResult && (
            <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
                <span className="text-xs font-medium text-gray-500">{lastResult.model}</span>
                <InlineCopyButton text={lastResult.content} />
              </div>
              <div className="p-5">
                <p className="whitespace-pre-wrap text-sm text-gray-800 leading-relaxed">
                  {lastResult.content}
                </p>
              </div>
            </div>
          )}

          {/* Alert states -- shown alongside last result, not replacing it */}
          {alert?.type === 'error' && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{alert.message}</p>
            </div>
          )}

          {alert?.type === 'paywall' && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4">
              <p className="text-sm font-medium text-amber-900 mb-1">You've used your free tests.</p>
              <p className="text-sm text-amber-800 mb-3">
                Subscribe for unlimited testing across all models.
              </p>
              <Link
                href="/pricing"
                className="inline-block px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors"
              >
                View pricing
              </Link>
            </div>
          )}

          {alert?.type === 'unauthenticated' && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
              <p className="text-sm text-gray-700 mb-3">Please sign in to test recipes.</p>
              <button
                onClick={() => signIn('google')}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
              >
                Sign in with Google
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
