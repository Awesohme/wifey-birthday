"use client";

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const isDev = process.env.NODE_ENV === "development";

  return (
    <main className="flex min-h-[60vh] items-center justify-center p-8">
      <div className="max-w-lg space-y-3 text-center">
        <h1 className="font-display text-2xl">Something fluttered off course.</h1>
        <p className="text-sm text-foreground/60">
          {isDev ? error.message : "An unexpected error occurred. Please try again."}
        </p>
        {isDev && error.stack ? (
          <pre className="max-h-64 overflow-auto rounded-2xl bg-leaf-900/5 p-3 text-left text-xs">
            {error.stack}
          </pre>
        ) : null}
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-royal-600 px-6 py-2.5 text-sm font-medium text-white shadow-lg shadow-royal-600/25"
        >
          Try again
        </button>
      </div>
    </main>
  );
}
