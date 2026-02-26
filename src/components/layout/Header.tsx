'use client';

import Link from 'next/link';
import ThemeToggle from '@/components/ui/ThemeToggle';

export default function Header() {
  const navItems = [
    { href: '/prize', label: '상품 추첨' },
    { href: '/name', label: '이름 추첨' },
    { href: '/number', label: '번호 뽑기' },
    { href: '/ladder', label: '사다리 타기' }
  ];

  return (
    <header className="bg-white dark:bg-slate-800 shadow-sm dark:shadow-slate-700/30 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-2xl">🎲</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">Lucky Pick</span>
          </Link>

          <nav className="hidden md:flex space-x-8">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 font-medium"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <div className="md:hidden">
              <button aria-label="메뉴 열기" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
