import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface FrameState {
  callbacks: Array<(t: number) => void>;
  now: number;
}

const setScrollY = (value: number): void => {
  Object.defineProperty(window, 'scrollY', {
    value,
    writable: true,
    configurable: true,
  });
};

describe('useScrollProgress', () => {
  const state: FrameState = { callbacks: [], now: 0 };

  beforeEach(() => {
    state.callbacks.length = 0;
    state.now = 0;

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
      state.callbacks.push(cb);
      return state.callbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    vi.spyOn(performance, 'now').mockImplementation(() => state.now);

    Object.defineProperty(document.documentElement, 'scrollHeight', {
      value: 2000,
      configurable: true,
    });
    Object.defineProperty(window, 'innerHeight', {
      value: 800,
      configurable: true,
    });
    setScrollY(0);

    // jsdom は scrollTo 未実装なのでデフォルトでモック化
    window.scrollTo = vi.fn() as unknown as typeof window.scrollTo;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flushFrames = (count: number, msPerFrame = 16): void => {
    Array.from({ length: count }).map(() => {
      state.now += msPerFrame;
      const pending = state.callbacks.slice();
      state.callbacks.length = 0;
      pending.map((cb) => cb(state.now));
    });
  };

  it('初期値は0', () => {
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it('スクロール時に滑らかにprogressが目標値へ収束する', () => {
    setScrollY(600);
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(120);
    });

    // 600 / (2000 - 800) = 0.5
    expect(result.current).toBeCloseTo(0.5, 2);
  });

  it('progressは0〜1の範囲に収まる', () => {
    setScrollY(5000);
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(120);
    });

    expect(result.current).toBeLessThanOrEqual(1);
    expect(result.current).toBeGreaterThanOrEqual(0);
  });

  it('フォーカス点近傍で停止すると最寄りのフォーカス点へスナップする', () => {
    // entry = 0.13 / scrollHeight = 1200 / 0.15 * 1200 = 180px
    setScrollY(180);

    const scrollToSpy = vi.fn((_x: number, y: number) => {
      setScrollY(y);
    });
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(3);
    });

    // SNAP_IDLE_MS(220ms)未経過なのでまだスナップ未開始
    expect(scrollToSpy).not.toHaveBeenCalled();

    // 十分時間が経過したらスナップ完了
    act(() => {
      flushFrames(60, 16);
    });

    expect(scrollToSpy).toHaveBeenCalled();
    const lastCall = scrollToSpy.mock.calls[scrollToSpy.mock.calls.length - 1];
    // entry(0.13) * 1200 = 156px へ収束
    expect(lastCall[1]).toBeCloseTo(156, 0);
  });

  it('フォーカスから離れた位置ではスナップしない', () => {
    // raw = 0.5（どのフォーカスにも近くない位置に停止）
    // 0.5 - premium(0.53) = 0.03 はSNAP_RANGE(0.05)内なので、
    // SNAP_RANGE外の例として 0.20 を使う（entry/standardから0.07以上離れる）
    setScrollY(240); // 240 / 1200 = 0.20

    const scrollToSpy = vi.fn();
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(60);
    });

    expect(scrollToSpy).not.toHaveBeenCalled();
  });

  it('ユーザーがホイール操作するとスナップが解除される', () => {
    setScrollY(180);

    const scrollToSpy = vi.fn((_x: number, y: number) => {
      setScrollY(y);
    });
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(20);
    });

    expect(scrollToSpy).toHaveBeenCalled();
    const callsBefore = scrollToSpy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new WheelEvent('wheel'));
      flushFrames(10);
    });

    // ホイール後はスナップが止まり、scrollTo回数が増えない
    expect(scrollToSpy.mock.calls.length).toBe(callsBefore);
  });

  it('ユーザーがタッチ操作するとスナップが解除される', () => {
    setScrollY(180);

    const scrollToSpy = vi.fn((_x: number, y: number) => {
      setScrollY(y);
    });
    window.scrollTo = scrollToSpy as unknown as typeof window.scrollTo;

    renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new Event('scroll'));
      flushFrames(20);
    });

    const callsBefore = scrollToSpy.mock.calls.length;

    act(() => {
      window.dispatchEvent(new TouchEvent('touchstart'));
      flushFrames(10);
    });

    expect(scrollToSpy.mock.calls.length).toBe(callsBefore);
  });
});
