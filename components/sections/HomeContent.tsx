'use client';

import { useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FallbackPage } from '@/components/ui/FallbackPage';
import { Navigation } from '@/components/ui/Navigation';
import { ImmersiveOverlay } from '@/components/ui/ImmersiveOverlay';

const TreeScene = dynamic(
  () => import('@/components/three/TreeScene'),
  {
    ssr: false,
    loading: () => <LoadingScreen />,
  }
);

export const HomeContent = () => {
  const isWebGLSupported = useWebGLSupport();
  const scrollProgress = useScrollProgress();
  const router = useRouter();

  const handleNavigate = useCallback(
    (path: string) => {
      router.push(path);
    },
    [router]
  );

  if (!isWebGLSupported) {
    return <FallbackPage />;
  }

  return (
    <main className="relative">
      <Navigation />

      {/* 3Dシーン（固定背景） */}
      <TreeScene onNavigate={handleNavigate} />

      {/* 没入型UIオーバーレイ */}
      <ImmersiveOverlay
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* スクロール用スペーサー（木を旅する長さ） */}
      <div
        className="relative z-0 pointer-events-none"
        style={{ height: '800vh' }}
      />

      {/* フッター */}
      <footer className="relative z-20 border-t border-[#1A1208] bg-[#0A0604]/90 backdrop-blur-sm py-16 text-center">
        <p className="text-3xl font-serif tracking-[0.3em] text-[#B8964E]">
          OAK BARGAIN
        </p>
        <p className="mt-3 text-sm tracking-[0.15em] text-[#6B5B45]">
          時を旅した輝きに、次の物語を
        </p>
        <p className="mt-10 text-xs text-[#3D2B1F]">
          &copy; 2024 OAK BARGAIN. All rights reserved.
        </p>
      </footer>
    </main>
  );
};
