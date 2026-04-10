'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ジュエリーフォーカス位置（CameraRigのFOCUS_CENTERSと一致）
const FOCUS_CENTERS = [0.13, 0.33, 0.53, 0.73];
const STICKY_RANGE = 0.10;
const STICKY_STRENGTH = 0.08; // フォーカス中心付近でのlerp係数（小さいほど遅い）

export const useScrollProgress = (): number => {
  const [progress, setProgress] = useState(0);
  const effectiveRef = useRef(0);
  const rafRef = useRef<number>(0);
  const rawRef = useRef(0);

  const handleScroll = useCallback(() => {
    const scrollHeight =
      document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight <= 0) return;
    rawRef.current = Math.min(Math.max(window.scrollY / scrollHeight, 0), 1);
  }, []);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    const tick = () => {
      const raw = rawRef.current;
      const eff = effectiveRef.current;
      const diff = raw - eff;

      // フォーカスゾーン付近ではlerp係数を極端に小さくする
      let lerpFactor = 0.12; // 通常時
      for (const center of FOCUS_CENTERS) {
        const dist = Math.abs(eff - center);
        if (dist < STICKY_RANGE) {
          const proximity = 1.0 - dist / STICKY_RANGE;
          const stickyLerp = STICKY_STRENGTH + (lerpFactor - STICKY_STRENGTH) * (1.0 - proximity * proximity);
          lerpFactor = Math.min(lerpFactor, stickyLerp);
        }
      }

      effectiveRef.current += diff * lerpFactor;
      setProgress(effectiveRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, [handleScroll]);

  return progress;
};
