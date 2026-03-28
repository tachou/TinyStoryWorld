import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const name = session.user.name ?? 'Teacher';

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">Welcome back, {name}!</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Classes
          </h2>
          <p className="mt-2 text-gray-700">
            Manage your classes, add students, and organize groups.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Assignments
          </h2>
          <p className="mt-2 text-gray-700">
            Create and track reading assignments and vocabulary activities.
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
            Progress
          </h2>
          <p className="mt-2 text-gray-700">
            View student progress reports and reading analytics.
          </p>
        </div>
      </div>
    </div>
  );
}
