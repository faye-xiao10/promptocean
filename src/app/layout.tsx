import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import Link from 'next/link';
import { SessionProvider } from '@/components/SessionProvider';
import { AuthButton } from '@/components/AuthButton';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'PromptOcean',
  description: 'Discover battle-tested system prompts for Claude, ChatGPT, and Gemini.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-gray-50">
        <SessionProvider>
          <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
              <div className="flex items-center gap-8">
                <Link href="/" className="font-bold text-gray-900 text-lg">
                  PromptOcean
                </Link>
                <nav className="hidden sm:flex items-center gap-6 text-sm text-gray-600">
                  <Link href="/recipes" className="hover:text-gray-900 transition-colors">
                    Browse
                  </Link>
                  <Link href="/submit" className="hover:text-gray-900 transition-colors">
                    Submit
                  </Link>
                </nav>
              </div>
              <AuthButton />
            </div>
          </header>

          <div className="flex-1 flex flex-col">{children}</div>

          <footer className="bg-white border-t border-gray-200">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex items-center justify-between text-sm text-gray-500">
              <span className="font-semibold text-gray-900">PromptOcean</span>
              <nav className="flex gap-6">
                <Link href="/recipes" className="hover:text-gray-900 transition-colors">
                  Browse
                </Link>
                <Link href="/submit" className="hover:text-gray-900 transition-colors">
                  Submit
                </Link>
              </nav>
            </div>
          </footer>
        </SessionProvider>
      </body>
    </html>
  );
}
