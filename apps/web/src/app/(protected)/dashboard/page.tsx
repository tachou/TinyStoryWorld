import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const name = session.user.name ?? 'Teacher';

  const cards = [
    {
      href: '/dashboard/classes',
      icon: '\u{1F3EB}',
      title: 'My Classes',
      description: 'Create classes, add students, and manage reading stages.',
    },
    {
      href: '/dashboard/assignments',
      icon: '\u{1F4DD}',
      title: 'Assignments',
      description: 'Assign books and Silly Sentences sessions to your classes.',
    },
    {
      href: '/dashboard/word-lists',
      icon: '\u{1F4CB}',
      title: 'Word Lists',
      description: 'Upload curriculum word lists to filter books and activities.',
    },
    {
      href: '/dashboard/books',
      icon: '\u{1F4DA}',
      title: 'Book Library',
      description: 'Import, browse, and manage books for your students.',
    },
    {
      href: '/dashboard/reports',
      icon: '\u{1F4C8}',
      title: 'Progress Reports',
      description: 'View student reading sessions, books read, and activity history.',
    },
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900">Teacher Dashboard</h1>
      <p className="mt-2 text-lg text-gray-600">Welcome back, {name}!</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-xl border border-gray-200 bg-white p-6 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
          >
            <span className="text-3xl">{card.icon}</span>
            <h2 className="mt-3 text-lg font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
              {card.title}
            </h2>
            <p className="mt-1 text-sm text-gray-600">{card.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
