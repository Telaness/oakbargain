'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

// ステップ位置（Top → Entry → Standard → Premium → Luxury → End）
// Entry以降の値はCameraRigのFOCUS_CENTERSと一致させる
const STEPS = [0, 0.13, 0.33, 0.53, 0.73, 1.0] as const;
const LAST_INDEX = STEPS.length - 1;

const STEP_LERP = 0.07; // 1フレームの補間係数（小さいほどゆっくり）
const COOLDOWN_MS = 800; // ステップ移動間のロック時間
const WHEEL_THRESHOLD = 30; // wheel deltaY 累積がこの値を超えたら1ステップ移動
const TOUCH_THRESHOLD = 60; // タッチスワイプがこの距離(px)で1ステップ移動

interface UseScrollProgressOptions {
  enabled?: boolean;
}

const isInputElement = (target: EventTarget | null): boolean =>
  target instanceof HTMLInputElement ||
  target instanceof HTMLTextAreaElement ||
  (target instanceof HTMLElement && target.isContentEditable);

export const useScrollProgress = (
  options: UseScrollProgressOptions = {},
): number => {
  const enabled = options.enabled ?? true;

  const [progress, setProgress] = useState(0);
  const targetIdxRef = useRef(0);
  const animatedRef = useRef(0);
  const wheelAccumRef = useRef(0);
  // 初回操作はクールダウン無視で受け付けたいので、過去側に十分振っておく
  const lastStepTimeRef = useRef(-COOLDOWN_MS);
  const touchStartYRef = useRef<number | null>(null);
  const rafRef = useRef<number>(0);

  const tryStep = useCallback((direction: 1 | -1): boolean => {
    const now = performance.now();
    if (now - lastStepTimeRef.current < COOLDOWN_MS) return false;
    const next = Math.max(0, Math.min(LAST_INDEX, targetIdxRef.current + direction));
    if (next === targetIdxRef.current) return false;
    targetIdxRef.current = next;
    lastStepTimeRef.current = now;
    wheelAccumRef.current = 0;
    return true;
  }, []);

  const handleWheel = useCallback(
    (e: WheelEvent): void => {
      e.preventDefault();
      const now = performance.now();
      if (now - lastStepTimeRef.current < COOLDOWN_MS) {
        // クールダウン中は累積をリセットして「貯め」を防ぐ
        wheelAccumRef.current = 0;
        return;
      }
      wheelAccumRef.current += e.deltaY;
      if (Math.abs(wheelAccumRef.current) >= WHEEL_THRESHOLD) {
        tryStep(wheelAccumRef.current > 0 ? 1 : -1);
      }
    },
    [tryStep],
  );

  const handleTouchStart = useCallback((e: TouchEvent): void => {
    const t = e.touches[0];
    touchStartYRef.current = t ? t.clientY : null;
  }, []);

  const handleTouchMove = useCallback(
    (e: TouchEvent): void => {
      const startY = touchStartYRef.current;
      if (startY === null) return;
      const t = e.touches[0];
      if (!t) return;
      e.preventDefault();
      const delta = startY - t.clientY;
      if (Math.abs(delta) >= TOUCH_THRESHOLD) {
        if (tryStep(delta > 0 ? 1 : -1)) {
          touchStartYRef.current = t.clientY;
        }
      }
    },
    [tryStep],
  );

  const handleTouchEnd = useCallback((): void => {
    touchStartYRef.current = null;
  }, []);

  const handleKey = useCallback(
    (e: KeyboardEvent): void => {
      if (isInputElement(e.target)) return;
      if (e.key === 'ArrowDown' || e.key === 'PageDown' || e.key === ' ') {
        e.preventDefault();
        tryStep(1);
      } else if (e.key === 'ArrowUp' || e.key === 'PageUp') {
        e.preventDefault();
        tryStep(-1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        targetIdxRef.current = 0;
        lastStepTimeRef.current = performance.now();
      } else if (e.key === 'End') {
        e.preventDefault();
        targetIdxRef.current = LAST_INDEX;
        lastStepTimeRef.current = performance.now();
      }
    },
    [tryStep],
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('keydown', handleKey);

    const tick = (): void => {
      const target = STEPS[targetIdxRef.current];
      const next = animatedRef.current + (target - animatedRef.current) * STEP_LERP;
      animatedRef.current = next;
      setProgress(next);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('keydown', handleKey);
      cancelAnimationFrame(rafRef.current);
    };
  }, [
    enabled,
    handleWheel,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    handleKey,
  ]);

  return progress;
};
