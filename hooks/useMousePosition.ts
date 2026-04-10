'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MousePosition } from '@/types/mouse';

const INITIAL_POSITION: MousePosition = {
  x: 0,
  y: 0,
  normalizedX: 0,
  normalizedY: 0,
};

export const useMousePosition = (): MousePosition => {
  const [position, setPosition] = useState<MousePosition>(INITIAL_POSITION);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    setPosition({
      x: e.clientX,
      y: e.clientY,
      normalizedX: (e.clientX / window.innerWidth) * 2 - 1,
      normalizedY: -(e.clientY / window.innerHeight) * 2 + 1,
    });
  }, []);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    setPosition({
      x: touch.clientX,
      y: touch.clientY,
      normalizedX: (touch.clientX / window.innerWidth) * 2 - 1,
      normalizedY: -(touch.clientY / window.innerHeight) * 2 + 1,
    });
  }, []);

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [handleMouseMove, handleTouchMove]);

  return position;
};
