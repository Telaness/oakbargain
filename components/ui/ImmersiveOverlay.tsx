'use client';

import { useMemo } from 'react';
import { LINE_CONFIGS, ZONE_CONFIGS } from '@/lib/constants';
import type { LineType } from '@/types/line';

interface ImmersiveOverlayProps {
  scrollProgress: number;
  onNavigate: (path: string) => void;
}

export const ImmersiveOverlay = ({ scrollProgress }: ImmersiveOverlayProps) => {
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
        </div>
      )}


      {/* ===== プログレスバー（左サイド・下から上へ） ===== */}
      <div className="absolute left-5 md:left-8 top-1/2 -translate-y-1/2 flex flex-col items-center gap-0">
        <div className="relative h-52 w-px bg-[#1A1208]">
          {/* バーは下から上に伸びる */}
          <div
            className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#C4956A] to-[#D4AF37] transition-all duration-300 ease-out"
            style={{ height: `${Math.round(scrollProgress * 100)}%` }}
          />
          {ZONE_CONFIGS.map((z) => {
            const isActive = scrollProgress >= z.scrollStart;
            return (
              <div
                key={z.id}
                className="absolute left-1/2 -translate-x-1/2 transition-all duration-300"
                style={{
                  bottom: `${z.scrollStart * 100}%`,
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

      {/* ===== ゾーンラベル（左サイド・下から上へ） ===== */}
      <div className="hidden md:block absolute left-14 top-1/2 -translate-y-1/2 h-52">
        {ZONE_CONFIGS.map((z) => {
          const isInZone = scrollProgress >= z.scrollStart && scrollProgress <= z.scrollEnd;
          const config = LINE_CONFIGS[z.id as LineType];
          return (
            <div
              key={z.id}
              className="absolute text-[10px] tracking-[0.2em] transition-all duration-300 whitespace-nowrap"
              style={{
                bottom: `${z.scrollStart * 100}%`,
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
      {scrollProgress > 0.03 && scrollProgress < 0.88 && !activeZone && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] tracking-[0.3em] text-[#4A3520] opacity-50">
          SCROLL
        </div>
      )}

      {/* ===== 終端: 真上の黒い天井に OAK BARGAIN ===== */}
      {scrollProgress > 0.85 && (
        <div
          className="absolute inset-x-0 bottom-[35%] flex flex-col items-center"
          style={{
            opacity: Math.min(1, Math.max(0, (scrollProgress - 0.88) / 0.10)),
          }}
        >
          <h2 className="text-center text-3xl md:text-7xl font-serif tracking-[0.35em] text-[#B8964E]">
            OAK BARGAIN
          </h2>
          <div
            className="mt-4 h-px bg-gradient-to-r from-transparent via-[#B8964E] to-transparent"
            style={{ width: '120px' }}
          />
          <p className="text-center mt-5 text-sm tracking-[0.2em] text-[#8B7355]">
            VINTAGE JEWELRY BRAND
          </p>
        </div>
      )}
    </div>
  );
};

