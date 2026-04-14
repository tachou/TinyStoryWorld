'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import SessionProvider from '@/components/session-provider';
import { useLanguageStore } from '@/stores/languageStore';
import { CurriculumSelector } from '@/components/CurriculumSelector';
import type { Language } from '@tiny-story-world/types';

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
  { label: 'Books', href: '/dashboard/books', icon: '\u{1F4DA}' },
  { label: 'Progress Reports', href: '/dashboard/reports', icon: '\u{1F4C8}' },
  { label: 'Moderation', href: '/dashboard/moderation', icon: '\u{1F6E1}\uFE0F' },
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

const LANGUAGES: { lang: Language; flag: string; label: string }[] = [
  { lang: 'en', flag: '\u{1F1EC}\u{1F1E7}', label: 'EN' },
  { lang: 'fr', flag: '\u{1F1EB}\u{1F1F7}', label: 'FR' },
  { lang: 'zh-Hans', flag: '\u{1F1E8}\u{1F1F3}', label: 'CN' },
];

function LanguageSelector() {
  const language = useLanguageStore((s) => s.language);
  const setLanguage = useLanguageStore((s) => s.setLanguage);

  return (
    <div className="shrink-0 px-4 py-3 border-t border-gray-200">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-2 px-1">
        Language
      </p>
      <div className="flex gap-1">
        {LANGUAGES.map(({ lang, flag, label }) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={`flex-1 flex flex-col items-center gap-0.5 py-2 rounded-lg text-xs font-medium transition-all ${
              language === lang
                ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-300'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
            }`}
            title={lang === 'en' ? 'English' : lang === 'fr' ? 'French' : 'Chinese'}
          >
            <span className="text-lg">{flag}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = (session?.user as any)?.role as string | undefined;
  const navItems = getNavForRole(role);

  return (
    <>
      <div className="border-b border-gray-200 px-6 py-5">
        <Link href="/" className="flex items-center gap-2" onClick={onNavigate}>
          <Image
            src="/favicon.png"
            alt="Tiny Story World"
            width={32}
            height={32}
            priority
            className="rounded-md"
          />
          <span className="font-fredoka text-xl font-bold text-gray-900">
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
                  onClick={onNavigate}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-50 text-primary-700'
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

      <LanguageSelector />
      <CurriculumSelector />

      <div className="shrink-0 border-t border-gray-200 px-4 py-4">
        <div className="mb-3">
          <p className="text-sm font-medium text-gray-900">
            {session?.user?.name ?? 'User'}
          </p>
          {role && (
            <span className="mt-1 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium capitalize text-primary-700">
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
    </>
  );
}

function MobileHeader({ onMenuToggle }: { onMenuToggle: () => void }) {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between border-b border-primary-100 bg-surface-soft px-4 py-3 md:hidden">
      <button
        onClick={onMenuToggle}
        className="flex items-center justify-center w-10 h-10 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Toggle menu"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <Link href="/" className="flex items-center gap-2">
        <Image
          src="/favicon.png"
          alt="Tiny Story World"
          width={28}
          height={28}
          priority
          className="rounded-md"
        />
        <span className="font-fredoka text-lg font-bold text-gray-900">Tiny Story World</span>
      </Link>
      <div className="w-10" />
    </header>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-surface">
      {/* Mobile header */}
      <MobileHeader onMenuToggle={() => setMobileOpen((o) => !o)} />

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-screen w-72 flex-col bg-surface-soft shadow-xl transition-transform duration-300 md:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 flex-col border-r border-primary-100 bg-surface-soft">
        <SidebarContent />
      </aside>

      {/* Main content */}
      <main className="pt-16 md:pt-0 md:ml-64 p-4 md:p-6">{children}</main>
    </div>
  );
}

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SessionProvider>
      <Layout>{children}</Layout>
    </SessionProvider>
  );
}
