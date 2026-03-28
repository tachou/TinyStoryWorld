import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function FamilyPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const name = session.user.name ?? 'Parent';

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Family Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">Welcome, {name}!</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u{1F4CA}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Reading Progress
          </h2>
          <p className="mt-1 text-gray-600">
            See how your child is progressing with their reading assignments.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <span className="text-3xl">{'\u{1F4CB}'}</span>
          <h2 className="mt-3 text-lg font-semibold text-gray-900">
            Word Lists
          </h2>
          <p className="mt-1 text-gray-600">
            Review the vocabulary words your child is learning at school.
          </p>
        </div>
      </div>
    </div>
  );
}
