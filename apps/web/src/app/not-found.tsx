"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
        <p className="mt-4">The page you are looking for does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-block text-blue-600 hover:underline"
        >
          Go back home
        </Link>
      </div>
    </main>
  );
}
