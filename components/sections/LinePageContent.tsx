'use client';

import Link from 'next/link';
import type { LineConfig } from '@/types/line';
import { Navigation } from '@/components/ui/Navigation';

interface LinePageContentProps {
  config: LineConfig;
}

export const LinePageContent = ({ config }: LinePageContentProps) => {
  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: config.colors.bg }}
    >
      <Navigation />

      {/* ヘッダーセクション */}
      <header className="flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <p
          className="text-sm tracking-[0.3em] uppercase opacity-60"
          style={{ color: config.colors.accent }}
        >
          {config.treePart}
        </p>
        <h1
          className="mt-4 text-5xl md:text-7xl font-serif tracking-wider"
          style={{ color: config.colors.accent }}
        >
          {config.name}
        </h1>
        <p
          className="mt-2 text-sm tracking-[0.15em]"
          style={{ color: config.colors.text, opacity: 0.6 }}
        >
          {config.nameSub}
        </p>
        <p
          className="mt-8 text-xl md:text-2xl font-serif"
          style={{ color: config.colors.text }}
        >
          {config.concept}
        </p>
      </header>

      {/* メインビジュアル */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        <div
          className="painting-filter aspect-[16/9] w-full rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${config.colors.bg}, ${config.colors.accent}60, ${config.colors.bg})`,
          }}
        />
      </section>

      {/* コンテンツ */}
      <section className="mx-auto max-w-3xl px-6 py-16">
        <p
          className="text-base leading-loose"
          style={{ color: config.colors.text }}
        >
          {config.description}
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div
            className="rounded-lg p-8"
            style={{
              backgroundColor: `${config.colors.accent}10`,
              borderLeft: `2px solid ${config.colors.accent}`,
            }}
          >
            <h3
              className="text-lg font-serif tracking-wider"
              style={{ color: config.colors.accent }}
            >
              素材へのこだわり
            </h3>
            <p
              className="mt-4 text-sm leading-relaxed opacity-80"
              style={{ color: config.colors.text }}
            >
              時を経たジュエリーだからこそ持つ、独特の風合いと輝き。
              一つひとつの素材が語る物語を大切にしています。
            </p>
          </div>
          <div
            className="rounded-lg p-8"
            style={{
              backgroundColor: `${config.colors.accent}10`,
              borderLeft: `2px solid ${config.colors.accent}`,
            }}
          >
            <h3
              className="text-lg font-serif tracking-wider"
              style={{ color: config.colors.accent }}
            >
              デザイン哲学
            </h3>
            <p
              className="mt-4 text-sm leading-relaxed opacity-80"
              style={{ color: config.colors.text }}
            >
              古いものを単に受け継ぐのではなく、現代の感性で再解釈し、
              新しい物語を紡ぎます。
            </p>
          </div>
        </div>
      </section>

      {/* 戻るボタン */}
      <section className="flex justify-center pb-20">
        <Link
          href="/"
          className="inline-block border px-10 py-4 text-sm tracking-[0.2em] transition-all hover:bg-white/10"
          style={{
            borderColor: config.colors.accent,
            color: config.colors.accent,
          }}
        >
          BACK TO TOP
        </Link>
      </section>
    </div>
  );
};
