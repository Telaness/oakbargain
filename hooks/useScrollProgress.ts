'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ジュエリーフォーカス位置（CameraRigのFOCUS_CENTERSと一致）
const FOCUS_CENTERS = [0.13, 0.33, 0.53, 0.73] as const;

// 表示値の慣性補間
const BASE_LERP = 0.12;
const STICKY_RANGE = 0.10;
const STICKY_STRENGTH = 0.05;

// スナップ挙動
const SNAP_RANGE = 0.05;
const SNAP_IDLE_MS = 220;
const SNAP_LERP = 0.14;
const SNAP_FINISH_PX = 0.6;
const PROGRAMMATIC_GUARD_MS = 80;

const computeStickyLerp = (effective: number): number =>
  FOCUS_CENTERS.reduce<number>((minLerp, center) => {
    const dist = Math.abs(effective - center);
    if (dist >= STICKY_RANGE) return minLerp;
    const proximity = 1.0 - dist / STICKY_RANGE;
    const sl =
      STICKY_STRENGTH +
      (BASE_LERP - STICKY_STRENGTH) * (1.0 - proximity * proximity);
    return Math.min(minLerp, sl);
  }, BASE_LERP);

export const useScrollProgress = (): number => {
  const [progress, setProgress] = useState(0);
  const effectiveRef = useRef(0);
  const rafRef = useRef<number>(0);
  const rawRef = useRef(0);
  const lastUserActivityRef = useRef(0);
  const snapTargetYRef = useRef<number | null>(null);
  const programmaticUntilRef = useRef(0);

  const computeRaw = useCallback((): number => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return 0;
    return Math.min(Math.max(window.scrollY / scrollHeight, 0), 1);
  }, []);

  const handleScroll = useCallback(() => {
    rawRef.current = computeRaw();
    const now = performance.now();
    if (now > programmaticUntilRef.current) {
      lastUserActivityRef.current = now;
      snapTargetYRef.current = null;
    }
  }, [computeRaw]);

  const handleUserInput = useCallback(() => {
    lastUserActivityRef.current = performance.now();
    snapTargetYRef.current = null;
  }, []);

  useEffect(() => {
    lastUserActivityRef.current = performance.now();
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('wheel', handleUserInput, { passive: true });
    window.addEventListener('touchstart', handleUserInput, { passive: true });
    window.addEventListener('touchmove', handleUserInput, { passive: true });
    window.addEventListener('keydown', handleUserInput);
    handleScroll();

    const tick = () => {
      const now = performance.now();
      const eff = effectiveRef.current;

      // フォーカス近傍で停止していたら、スナップ目標を設定
      if (
        snapTargetYRef.current === null &&
        now - lastUserActivityRef.current > SNAP_IDLE_MS
      ) {
        const raw = rawRef.current;
        const candidate = FOCUS_CENTERS.find(
          (c) => Math.abs(raw - c) < SNAP_RANGE,
        );
        if (candidate !== undefined && Math.abs(raw - candidate) > 0.0005) {
          const scrollHeight =
            document.documentElement.scrollHeight - window.innerHeight;
          if (scrollHeight > 0) {
            snapTargetYRef.current = candidate * scrollHeight;
          }
        }
      }

      // スナップ実行（プログラム発火のscrollイベントは guard で無視）
      const snapTargetY = snapTargetYRef.current;
      if (snapTargetY !== null) {
        const currentY = window.scrollY;
        const remaining = snapTargetY - currentY;
        programmaticUntilRef.current = now + PROGRAMMATIC_GUARD_MS;
        if (Math.abs(remaining) <= SNAP_FINISH_PX) {
          window.scrollTo(0, snapTargetY);
          snapTargetYRef.current = null;
        } else {
          window.scrollTo(0, currentY + remaining * SNAP_LERP);
        }
        rawRef.current = computeRaw();
      }

      // 表示値（フォーカス付近で減速）
      const lerpFactor = computeStickyLerp(eff);
      effectiveRef.current = eff + (rawRef.current - eff) * lerpFactor;
      setProgress(effectiveRef.current);

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('wheel', handleUserInput);
      window.removeEventListener('touchstart', handleUserInput);
      window.removeEventListener('touchmove', handleUserInput);
      window.removeEventListener('keydown', handleUserInput);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll, handleUserInput, computeRaw]);

  return progress;
};
