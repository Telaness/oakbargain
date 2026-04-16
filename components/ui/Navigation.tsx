'use client';

import { useState, useEffect, useCallback } from 'react';
import { TransitionLink } from './TransitionLink';

const NAV_ITEMS = [
  { href: '/story', label: 'STORY', sub: 'ブランドストーリー' },
  { href: '/access', label: 'ACCESS', sub: 'アクセス' },
] as const;

export const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);

  // メニュー展開中はスクロール禁止
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const handleClose = useCallback(() => setIsOpen(false), []);

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 md:px-12">
        <TransitionLink
          href="/"
          className="text-xl font-serif tracking-[0.2em] text-[#B8964E] hover:opacity-80 transition-opacity"
        >
          OAK BARGAIN
        </TransitionLink>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center gap-8">
          {NAV_ITEMS.map((item) => (
            <TransitionLink
              key={item.href}
              href={item.href}
              className="text-sm tracking-[0.1em] text-[#8B7355] hover:text-[#B8964E] transition-colors"
            >
              {item.label}
            </TransitionLink>
          ))}
        </div>
      </nav>

      {/* Mobile Hamburger Button — z-[54]でLineModal(z-[55]以上)の下に隠れる */}
      <button
        className="md:hidden fixed top-4 right-6 z-[54] w-8 h-8 flex items-center justify-center"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        <span
          className="absolute block h-[1px] w-6 bg-[#B8964E] transition-all duration-300 ease-out"
          style={{
            transform: isOpen ? 'rotate(45deg)' : 'translateY(-4px)',
          }}
        />
        <span
          className="absolute block h-[1px] w-6 bg-[#B8964E] transition-all duration-300 ease-out"
          style={{
            opacity: isOpen ? 0 : 1,
            transform: isOpen ? 'scaleX(0)' : 'scaleX(1)',
          }}
        />
        <span
          className="absolute block h-[1px] w-6 bg-[#B8964E] transition-all duration-300 ease-out"
          style={{
            transform: isOpen ? 'rotate(-45deg)' : 'translateY(4px)',
          }}
        />
      </button>

      {/* Mobile Fullscreen Menu — z-[53]でボタン(z-[54])の下、nav(z-50)の上 */}
      <div
        className="fixed inset-0 z-[53] md:hidden flex flex-col items-center justify-center transition-all duration-500 ease-out"
        style={{
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
          background: 'radial-gradient(ellipse at 50% 40%, #1A120A 0%, #0A0604 70%)',
        }}
      >
        {/* 装飾線（上） */}
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 transition-all duration-700 delay-200 ease-out"
          style={{
            width: isOpen ? '60px' : '0px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #B8964E, transparent)',
          }}
        />

        {/* メニュー項目 */}
        <div className="flex flex-col items-center gap-12">
          {NAV_ITEMS.map((item, i) => (
            <div
              key={item.href}
              className="transition-all duration-500 ease-out"
              style={{
                opacity: isOpen ? 1 : 0,
                transform: isOpen ? 'translateY(0)' : 'translateY(20px)',
                transitionDelay: isOpen ? `${300 + i * 100}ms` : '0ms',
              }}
            >
              <TransitionLink
                href={item.href}
                className="group flex flex-col items-center"
                onClick={handleClose}
              >
                <span className="text-2xl tracking-[0.3em] text-[#C8B89A] font-serif group-hover:text-[#B8964E] transition-colors duration-300">
                  {item.label}
                </span>
                <span className="mt-2 text-xs tracking-[0.15em] text-[#6B5B4A] group-hover:text-[#8B7355] transition-colors duration-300">
                  {item.sub}
                </span>
              </TransitionLink>
            </div>
          ))}
        </div>

        {/* 装飾線（下） */}
        <div
          className="absolute bottom-32 left-1/2 -translate-x-1/2 transition-all duration-700 delay-200 ease-out"
          style={{
            width: isOpen ? '60px' : '0px',
            height: '1px',
            background: 'linear-gradient(90deg, transparent, #B8964E, transparent)',
          }}
        />

        {/* ブランド名フッター */}
        <div
          className="absolute bottom-16 flex flex-col items-center transition-all duration-500 delay-500 ease-out"
          style={{
            opacity: isOpen ? 0.3 : 0,
          }}
        >
          <span className="text-xs tracking-[0.4em] text-[#6B5B4A] font-serif">
            OAK BARGAIN
          </span>
        </div>
      </div>
    </>
  );
};
