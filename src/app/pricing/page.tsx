import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { CheckoutButton } from '@/components/CheckoutButton';

export const metadata: Metadata = {
  title: 'Pricing | PromptOcean',
  description: 'Upgrade to PromptOcean Pro for unlimited AI testing.',
};

type PageProps = {
  searchParams: Promise<{ success?: string; canceled?: string }>;
};

const FREE_FEATURES = [
  'Browse all recipes',
  'Copy any recipe',
  '2 free tests across any model',
];

const PRO_FEATURES = [
  'Everything in Free',
  'Unlimited testing across Claude, GPT-4o, and Gemini',
  'Priority access to new models as they launch',
];

export default async function PricingPage({ searchParams }: PageProps) {
  const [session, { success, canceled }] = await Promise.all([
    auth(),
    searchParams,
  ]);

  const isSubscribed = session?.user?.subscriptionStatus === 'active';

  return (
    <main className="flex-1">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        {/* Status banners */}
        {success === 'true' && (
          <div className="mb-8 rounded-lg bg-green-50 border border-green-200 px-5 py-4 text-sm text-green-800">
            <span className="font-medium">Welcome to Pro!</span> You now have unlimited tests.
          </div>
        )}
        {canceled === 'true' && (
          <div className="mb-8 rounded-lg bg-gray-100 border border-gray-200 px-5 py-4 text-sm text-gray-600">
            Checkout canceled. You can subscribe anytime.
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-3">Upgrade to PromptOcean Pro</h1>
          <p className="text-gray-500 text-lg">
            Test any recipe against the best AI models, as many times as you want.
          </p>
        </div>

        {/* Tier cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Free tier */}
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <div className="mb-6">
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">Free</p>
              <p className="text-4xl font-bold text-gray-900">$0</p>
            </div>
            <ul className="space-y-3 mb-8">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <div className="w-full py-2.5 px-6 rounded-lg border border-gray-200 text-gray-500 font-medium text-sm text-center">
              Current plan
            </div>
          </div>

          {/* Pro tier */}
          <div className="rounded-2xl border-2 border-indigo-600 bg-white p-8 relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                Recommended
              </span>
            </div>
            <div className="mb-6">
              <p className="text-sm font-medium text-indigo-600 uppercase tracking-wide mb-1">Pro</p>
              <div className="flex items-baseline gap-1">
                <p className="text-4xl font-bold text-gray-900">$7</p>
                <span className="text-gray-500 text-sm">/ month</span>
              </div>
            </div>
            <ul className="space-y-3 mb-8">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-sm text-gray-700">
                  <svg className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {f}
                </li>
              ))}
            </ul>
            <CheckoutButton isSubscribed={isSubscribed} />
          </div>
        </div>
      </div>
    </main>
  );
}
