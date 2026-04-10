'use client';

import Link from 'next/link';
import { LINE_CONFIGS, LINE_ORDER } from '@/lib/constants';

export const FallbackPage = () => {
  return (
    <div className="min-h-screen bg-[#0A0604] text-[#F0EDE6]">
      <header className="flex flex-col items-center justify-center py-20">
        <h1 className="mb-4 text-5xl font-serif tracking-[0.3em] text-[#B8964E]">
          OAK BARGAIN
        </h1>
        <p className="text-lg tracking-[0.15em] text-[#8B7355]">
          時を旅した輝きに、次の物語を
        </p>
      </header>

      <div className="mx-auto max-w-4xl px-6">
        <p className="mb-12 text-center text-sm text-[#8B7355]">
          お使いのブラウザはWebGLに対応しておりません。
          <br />
          以下よりラインナップをご覧いただけます。
        </p>

        <div className="grid gap-6 md:grid-cols-2">
          {LINE_ORDER.map((lineId) => {
            const config = LINE_CONFIGS[lineId];
            return (
              <Link
                key={config.id}
                href={config.path}
                className="group block rounded-lg border border-[#2C1A0E] p-8 transition-all hover:border-[#B8964E] hover:bg-[#1A0E00]/50"
              >
                <h2
                  className="mb-2 text-2xl font-serif tracking-wider"
                  style={{ color: config.colors.accent }}
                >
                  {config.name}
                </h2>
                <p className="mb-1 text-sm text-[#8B7355]">
                  {config.nameSub}
                </p>
                <p className="text-base text-[#C4956A]">{config.concept}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <footer className="mt-20 border-t border-[#2C1A0E] py-8 text-center text-sm text-[#6B5B45]">
        <Link href="/story" className="mx-4 hover:text-[#B8964E]">
          ブランドストーリー
        </Link>
        <Link href="/access" className="mx-4 hover:text-[#B8964E]">
          アクセス
        </Link>
      </footer>
    </div>
  );
};
