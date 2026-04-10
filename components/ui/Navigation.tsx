'use client';

import { useState } from 'react';
import Link from 'next/link';

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
      <Link
        href="/"
        className="text-xl font-serif tracking-[0.2em] text-[#B8964E] hover:opacity-80 transition-opacity"
      >
        OAK BARGAIN
      </Link>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-8">
        <Link
          href="/story"
          className="text-sm tracking-[0.1em] text-[#8B7355] hover:text-[#B8964E] transition-colors"
        >
          STORY
        </Link>
        <Link
          href="/access"
          className="text-sm tracking-[0.1em] text-[#8B7355] hover:text-[#B8964E] transition-colors"
        >
          ACCESS
        </Link>
      </div>

      {/* Mobile Hamburger */}
      <button
        className="md:hidden flex flex-col gap-1.5 p-2"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        <span
          className={`block h-[1px] w-6 bg-[#B8964E] transition-transform ${
            isOpen ? 'translate-y-[7px] rotate-45' : ''
          }`}
        />
        <span
          className={`block h-[1px] w-6 bg-[#B8964E] transition-opacity ${
            isOpen ? 'opacity-0' : ''
          }`}
        />
        <span
          className={`block h-[1px] w-6 bg-[#B8964E] transition-transform ${
            isOpen ? '-translate-y-[7px] -rotate-45' : ''
          }`}
        />
      </button>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 bg-[#0A0604]/95 backdrop-blur-md py-8 flex flex-col items-center gap-6 md:hidden border-b border-[#2C1A0E]">
          <Link
            href="/story"
            className="text-sm tracking-[0.15em] text-[#8B7355] hover:text-[#B8964E]"
            onClick={() => setIsOpen(false)}
          >
            STORY
          </Link>
          <Link
            href="/access"
            className="text-sm tracking-[0.15em] text-[#8B7355] hover:text-[#B8964E]"
            onClick={() => setIsOpen(false)}
          >
            ACCESS
          </Link>
        </div>
      )}
    </nav>
  );
};
