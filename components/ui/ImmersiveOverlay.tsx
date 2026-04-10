'use client';

import { useMemo } from 'react';
import { LINE_CONFIGS, ZONE_CONFIGS } from '@/lib/constants';
import type { LineType } from '@/types/line';

interface ImmersiveOverlayProps {
  scrollProgress: number;
  onNavigate: (path: string) => void;
}

export const ImmersiveOverlay = ({ scrollProgress, onNavigate }: ImmersiveOverlayProps) => {
  const activeZone = useMemo(() => {
    return ZONE_CONFIGS.find(
      (z) => scrollProgress >= z.scrollStart && scrollProgress <= z.scrollEnd
    ) ?? null;
  }, [scrollProgress]);

  const showHero = scrollProgress < 0.05;
  const heroOpacity = Math.max(0, 1 - scrollProgress * 22);

  return (
    <div className="fixed inset-0 z-30 pointer-events-none">
      {/* ===== ヒーロー（木の天辺から見下ろし） ===== */}
      {showHero && (
        <div
          className="absolute bottom-16 right-8 md:bottom-24 md:right-16 text-right"
          style={{ opacity: heroOpacity }}
        >
          <p className="mb-2 text-[10px] tracking-[0.35em] text-[#8B7355] uppercase animate-fade-in">
            Vintage Jewelry Brand
          </p>
          <h1 className="text-4xl md:text-6xl font-serif tracking-[0.2em] text-[#B8964E] animate-fade-in-delay">
            OAK BARGAIN
          </h1>
          <p className="mt-3 text-sm md:text-base tracking-[0.15em] text-[#C4956A] animate-fade-in-delay-2">
            時を旅した輝きに、次の物語を
          </p>
          <div className="mt-8 flex items-center justify-end gap-2 text-[#6B5B45] text-xs tracking-[0.2em]">
            <span>SCROLL TO DESCEND</span>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="animate-bounce"
            >
              <path d="M12 5v14M19 12l-7 7-7-7" />
            </svg>
          </div>
        </div>
      )}

      {/* ===== ゾーンカード ===== */}
      {activeZone && (
        <ZoneCard
          zone={activeZone}
          scrollProgress={scrollProgress}
          onNavigate={onNavigate}
        />
      )}

      {/* ===== プログレスバー（左サイド・上から下へ） ===== */}
      <div className="absolute left-5 md:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0">
        <div className="relative h-52 w-px bg-[#1A1208]">
          {/* バーは上から下に伸びる */}
          <div
            className="absolute top-0 left-0 w-full bg-gradient-to-b from-[#D4AF37] to-[#B8964E] transition-all duration-300 ease-out"
            style={{ height: `${Math.round(scrollProgress * 100)}%` }}
          />
          {ZONE_CONFIGS.map((z) => {
            const isActive = scrollProgress >= z.scrollStart;
            return (
              <div
                key={z.id}
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
                style={{
                  top: `${z.scrollStart * 100}%`,
                }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: isActive ? '#B8964E' : '#2C1A0E',
                    boxShadow: isActive ? '0 0 10px rgba(184,150,78,0.6)' : 'none',
                    transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  }}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* ===== ゾーンラベル（左サイド） ===== */}
      <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 h-52">
        {ZONE_CONFIGS.map((z) => {
          const isInZone = scrollProgress >= z.scrollStart && scrollProgress <= z.scrollEnd;
          const config = LINE_CONFIGS[z.id as LineType];
          return (
            <div
              key={z.id}
              className="absolute text-[10px] tracking-[0.2em] transition-all duration-300 whitespace-nowrap"
              style={{
                top: `${z.scrollStart * 100}%`,
                color: isInZone ? config.colors.accent : '#2C1A0E',
                transform: isInZone ? 'translateX(8px)' : 'translateX(0)',
                opacity: isInZone ? 1 : 0.3,
              }}
            >
              {z.label}
            </div>
          );
        })}
      </div>

      {/* ===== 下部のスクロールヒント ===== */}
      {scrollProgress > 0.03 && scrollProgress < 0.92 && !activeZone && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-[#4A3520] opacity-50">
          SCROLL
        </div>
      )}
    </div>
  );
};

// ===== ゾーン情報カード =====
const ZoneCard = ({
  zone,
  scrollProgress,
  onNavigate,
}: {
  zone: (typeof ZONE_CONFIGS)[number];
  scrollProgress: number;
  onNavigate: (path: string) => void;
}) => {
  const config = LINE_CONFIGS[zone.id as LineType];

  const zoneProgress =
    (scrollProgress - zone.scrollStart) / (zone.scrollEnd - zone.scrollStart);
  const opacity =
    zoneProgress < 0.1
      ? zoneProgress / 0.1
      : zoneProgress > 0.9
        ? (1 - zoneProgress) / 0.1
        : 1;

  const translateY = zoneProgress < 0.1 ? (1 - zoneProgress / 0.1) * 15 : 0;

  return (
    <div
      className="absolute right-6 md:right-16 top-1/2 -translate-y-1/2 pointer-events-auto"
      style={{
        opacity: Math.max(0, Math.min(1, opacity)),
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div className="zone-card w-72 md:w-80 p-6 md:p-8">
        <p
          className="text-[9px] tracking-[0.35em] uppercase"
          style={{ color: `${config.colors.accent}90` }}
        >
          {config.treePart} — {config.nameSub}
        </p>

        <h3
          className="mt-3 text-2xl md:text-3xl font-serif tracking-wider leading-tight"
          style={{ color: config.colors.accent }}
        >
          {config.name}
        </h3>

        <p
          className="mt-4 text-sm md:text-base font-serif leading-relaxed"
          style={{ color: '#F0EDE6' }}
        >
          {config.concept}
        </p>

        <p className="mt-3 text-[11px] leading-relaxed text-[#9A8A78]">
          {config.description}
        </p>

        <button
          onClick={() => onNavigate(config.path)}
          className="zone-card-button mt-6 border px-6 py-2.5 text-[10px] tracking-[0.25em] uppercase transition-all duration-300"
          style={{
            borderColor: `${config.colors.accent}60`,
            color: config.colors.accent,
          }}
        >
          Explore →
        </button>
      </div>
    </div>
  );
};
