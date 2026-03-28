'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import SessionProvider from '@/components/session-provider';

type NavItem = {
  label: string;
  href: string;
  icon: string;
};

const teacherNav: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: '\u{1F4CA}' },
  { label: 'My Classes', href: '/dashboard/classes', icon: '\u{1F469}\u200D\u{1F3EB}' },
  { label: 'Assignments', href: '/dashboard/assignments', icon: '\u{1F4DD}' },
  { label: 'Word Lists', href: '/dashboard/word-lists', icon: '\u{1F4CB}' },
  { label: 'Progress Reports', href: '/dashboard/reports', icon: '\u{1F4C8}' },
];

const studentNav: NavItem[] = [
  { label: 'My Portal', href: '/portal', icon: '\u{1F3E0}' },
  { label: 'Book Library', href: '/portal/library', icon: '\u{1F4D6}' },
  { label: 'Silly Sentences', href: '/silly-sentences', icon: '\u{1F9E9}' },
  { label: 'Battle Stories', href: '/battle-stories', icon: '\u2694\uFE0F' },
  { label: 'AI Stories', href: '/stories', icon: '\u2728' },
  { label: 'Badges', href: '/portal/badges', icon: '\u{1F3C6}' },
];

const parentNav: NavItem[] = [
  { label: 'Family Dashboard', href: '/family', icon: '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}' },
  { label: 'Word Lists', href: '/family/word-lists', icon: '\u{1F4CB}' },
];

const adminNav: NavItem[] = [
  ...teacherNav,
  { label: 'Admin', href: '/admin', icon: '\u{1F6E1}\uFE0F' },
];

function getNavForRole(role: string | undefined): NavItem[] {
  switch (role) {
    case 'admin':
      return adminNav;
    case 'teacher':
      return teacherNav;
    case 'student':
      return studentNav;
    case 'parent':
      return parentNav;
    default:
      return studentNav;
  }
}

function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const navItems = getNavForRole(role);

  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-gray-200 bg-white">
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-2xl">{'\u{1F4DA}'}</span>
          <span className="text-xl font-bold text-gray-900">
            Tiny Story World
          </span>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-gray-200 px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name ?? 'User'}
          </p>
          {role && (
            <span className="mt-1 inline-block rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium capitalize text-indigo-700">
              {role}
            </span>
          )}
        </div>
        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-100"
        >
          Sign Out
        </button>
      </div>
    </aside>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <div className="min-h-screen bg-gray-50">
        <Sidebar />
        <main className="ml-64 p-6">{children}</main>
      </div>
    </SessionProvider>
  );
}
