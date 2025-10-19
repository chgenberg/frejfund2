'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for quick diagnostics
    // (Next.js also reports this server-side)
    // Do not expose sensitive details in UI
    // eslint-disable-next-line no-console
    console.error('Render error:', error);
  }, [error]);

  return (
    <html>
      <body className="min-h-screen bg-white text-black flex items-center justify-center p-6">
        <div className="w-full max-w-md border border-gray-200 rounded-2xl p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-black mx-auto mb-4 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <h1 className="text-lg font-semibold mb-2">Something went wrong</h1>
          <p className="text-sm text-gray-600 mb-4">The page failed to render. Please try again.</p>
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => reset()}
              className="px-4 py-2 bg-black text-white rounded-full text-sm hover:bg-gray-800"
            >
              Try again
            </button>
            <Link
              href="/"
              className="px-4 py-2 border border-gray-300 rounded-full text-sm hover:border-black"
            >
              Go home
            </Link>
          </div>
          {process.env.NODE_ENV !== 'production' && error?.digest && (
            <p className="mt-4 text-xs text-gray-400">Digest: {error.digest}</p>
          )}
        </div>
      </body>
    </html>
  );
}
