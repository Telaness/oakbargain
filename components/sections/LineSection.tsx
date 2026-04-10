'use client';

import Link from 'next/link';
import type { LineConfig } from '@/types/line';

interface LineSectionProps {
  config: LineConfig;
  index: number;
}

export const LineSection = ({ config, index }: LineSectionProps) => {
  const isEven = index % 2 === 0;

  return (
    <section
      className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 md:px-12"
      style={{ backgroundColor: `${config.colors.bg}20` }}
    >
      <div
        className={`flex w-full max-w-5xl flex-col gap-8 md:flex-row ${
          isEven ? '' : 'md:flex-row-reverse'
        } items-center`}
      >
        <div className="flex-1 space-y-6">
          <div>
            <h2
              className="text-4xl md:text-6xl font-serif tracking-wider"
              style={{ color: config.colors.accent }}
            >
              {config.name}
            </h2>
            <p
              className="mt-2 text-sm tracking-[0.15em]"
              style={{ color: `${config.colors.accent}80` }}
            >
              {config.nameSub}
            </p>
          </div>
          <p
            className="text-xl md:text-2xl font-serif"
            style={{ color: config.colors.text }}
          >
            {config.concept}
          </p>
          <p
            className="text-sm leading-relaxed opacity-80"
            style={{ color: config.colors.text }}
          >
            {config.description}
          </p>
          <Link
            href={config.path}
            className="inline-block border px-8 py-3 text-sm tracking-[0.2em] transition-all hover:bg-white/10"
            style={{
              borderColor: config.colors.accent,
              color: config.colors.accent,
            }}
          >
            VIEW MORE
          </Link>
        </div>

        <div className="flex-1">
          <div
            className="aspect-[3/4] w-full rounded-lg"
            style={{
              background: `linear-gradient(135deg, ${config.colors.bg}, ${config.colors.accent}40)`,
              filter: 'sepia(0.3) contrast(1.1) saturate(0.8)',
            }}
          />
        </div>
      </div>
    </section>
  );
};
