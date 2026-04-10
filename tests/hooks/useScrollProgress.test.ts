import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

describe('useScrollProgress', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
  });

  it('初期値は0', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 0,
      configurable: true,
    });

    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it('スクロール時にprogressが更新される', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 600,
      configurable: true,
    });

    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBe(0.5);
  });

  it('progressは0〜1の範囲にクランプされる', () => {
    Object.defineProperty(window, 'scrollY', {
      value: 5000,
      configurable: true,
    });

    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
    });

    expect(result.current).toBeLessThanOrEqual(1);
  });
});
