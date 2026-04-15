'use client';

import { useCallback, useState } from 'react';
import dynamic from 'next/dynamic';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';
import { useScrollProgress } from '@/hooks/useScrollProgress';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { FallbackPage } from '@/components/ui/FallbackPage';
import { Navigation } from '@/components/ui/Navigation';
import { ImmersiveOverlay } from '@/components/ui/ImmersiveOverlay';
import { LineModal } from '@/components/ui/LineModal';
import type { LineType } from '@/types/line';

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
  const [modalLine, setModalLine] = useState<LineType | null>(null);

  // パスからLineTypeを抽出してモーダルを開く
  const handleNavigate = useCallback((path: string) => {
    const match = path.match(/\/lines\/(\w+)/);
    if (match) {
      setModalLine(match[1] as LineType);
    }
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalLine(null);
  }, []);

  if (!isWebGLSupported) {
    return <FallbackPage />;
  }

  return (
    <main className="relative">
      <Navigation />

      {/* 3Dシーン（固定背景） */}
      <TreeScene onNavigate={handleNavigate} paused={modalLine !== null} />

      {/* ほこりオーバーレイ（パフォーマンス対策で無効化） */}

      {/* 没入型UIオーバーレイ */}
      <ImmersiveOverlay
        scrollProgress={scrollProgress}
        onNavigate={handleNavigate}
      />

      {/* Line詳細モーダル */}
      <LineModal key={modalLine ?? 'none'} lineId={modalLine} onClose={handleCloseModal} />

      {/* スクロール用スペーサー（木を旅する長さ） */}
      <div
        className="relative z-0 pointer-events-none"
        style={{ height: '800vh' }}
      />

    </main>
  );
};
