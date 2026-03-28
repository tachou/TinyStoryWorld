import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    const role = (session.user as any).role as string | undefined;
    switch (role) {
      case 'teacher':
        redirect('/dashboard');
      case 'admin':
        redirect('/dashboard');
      case 'student':
        redirect('/portal');
      case 'parent':
        redirect('/family');
      default:
        redirect('/portal');
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-12 p-8">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-900">
          {'\u{1F4DA}'} Tiny Story World
        </h1>
        <p className="mt-4 max-w-xl text-lg text-gray-600">
          A multilingual learning platform for K-6 classrooms. Build
          vocabulary, practice grammar, and have fun with stories.
        </p>
      </div>

      <div className="grid max-w-4xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="text-4xl">{'\u{1F4D6}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">Reader</h2>
          <p className="mt-1 text-sm text-gray-600">
            Interactive bilingual stories with built-in vocabulary support.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="text-4xl">{'\u{1F9E9}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Silly Sentences
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Drag-and-drop sentence building for grammar practice.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="text-4xl">{'\u2694\uFE0F'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Battle Stories
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Competitive vocabulary battles and story challenges.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
          <span className="text-4xl">{'\u2728'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            AI Stories
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            AI-generated stories using your vocabulary words.
          </p>
        </div>
      </div>

      <div className="flex gap-4">
        <Link
          href="/login"
          className="rounded-lg bg-indigo-600 px-6 py-3 font-medium text-white transition-colors hover:bg-indigo-700"
        >
          Sign In
        </Link>
        <Link
          href="/register"
          className="rounded-lg border border-gray-300 bg-white px-6 py-3 font-medium text-gray-700 transition-colors hover:bg-gray-50"
        >
          Create Account
        </Link>
      </div>
    </main>
  );
}
