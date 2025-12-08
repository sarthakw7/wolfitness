'use client';

import Link from 'next/link';

export default function VerifyPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-neutral-900 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Check your email
          </h2>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We've sent you a verification link. Please check your email to verify your account.
          </p>
        </div>

        <div className="mt-4 bg-white dark:bg-neutral-800 p-6 rounded-lg shadow border border-gray-200 dark:border-neutral-700">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Once verified, you'll be able to sign in and access your dashboard.
          </p>
          
          <Link href="/auth/login" className="text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
