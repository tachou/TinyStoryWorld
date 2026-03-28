import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function PortalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const name = session.user.name ?? 'Student';

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Student Portal</h1>
      <p className="mt-2 text-lg text-gray-600">Welcome back, {name}!</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u{1F4D6}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Assigned Books
          </h2>
          <p className="mt-1 text-gray-600">
            Read stories assigned by your teacher and practice vocabulary.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u{1F9E9}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Silly Sentences
          </h2>
          <p className="mt-1 text-gray-600">
            Build funny sentences to practice grammar and vocabulary.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u2694\uFE0F'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Battle Stories
          </h2>
          <p className="mt-1 text-gray-600">
            Compete with classmates in vocabulary battles and story challenges.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u{1F3C6}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            My Badges
          </h2>
          <p className="mt-1 text-gray-600">
            View your earned badges and track your achievements.
          </p>
        </div>
      </div>
    </div>
  );
}
