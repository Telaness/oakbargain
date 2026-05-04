import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollProgress } from '@/hooks/useScrollProgress';

interface FrameState {
  callbacks: Array<(t: number) => void>;
  now: number;
}

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

  const dispatchWheel = (deltaY: number): void => {
    const ev = new WheelEvent('wheel', { deltaY, cancelable: true });
    window.dispatchEvent(ev);
  };

  it('初期値は0', () => {
    const { result } = renderHook(() => useScrollProgress());
    expect(result.current).toBe(0);
  });

  it('1回ホイールスクロールするとEntryステップ(0.13)へ移動する', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      dispatchWheel(100);
      flushFrames(150);
    });

    expect(result.current).toBeCloseTo(0.13, 2);
  });

  it('連続して強くスクロールしてもクールダウン中は次へ進まない', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      dispatchWheel(500); // ステップ1へ
      flushFrames(5);
      // クールダウン中(800ms未経過)はいくらホイールしても無視される
      dispatchWheel(500);
      dispatchWheel(500);
      dispatchWheel(500);
      flushFrames(120);
    });

    // Entry(0.13)で確実に止まり、Standard(0.33)へは進んでいない
    expect(result.current).toBeCloseTo(0.13, 2);
  });

  it('クールダウン経過後は次のステップへ進める', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      dispatchWheel(100);
      flushFrames(60); // 16ms * 60 = 960ms（クールダウン超過）
      dispatchWheel(100);
      flushFrames(150);
    });

    expect(result.current).toBeCloseTo(0.33, 2);
  });

  it('上方向にスクロールすると前のステップへ戻る', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      dispatchWheel(100);
      flushFrames(60);
      dispatchWheel(100);
      flushFrames(60);
      dispatchWheel(-100);
      flushFrames(150);
    });

    expect(result.current).toBeCloseTo(0.13, 2);
  });

  it('最上端より上、最下端より下にはステップしない', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      // 最初は0、上方向スクロールしても0のまま
      dispatchWheel(-100);
      flushFrames(60);
    });

    expect(result.current).toBe(0);
  });

  it('Endキーで最終ステップへ、Homeキーで最上ステップへジャンプする', () => {
    const { result } = renderHook(() => useScrollProgress());

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'End' }));
      flushFrames(200);
    });

    expect(result.current).toBeCloseTo(1.0, 1);

    act(() => {
      // クールダウン解除のため十分時間経過
      state.now += 1000;
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home' }));
      flushFrames(200);
    });

    expect(result.current).toBeCloseTo(0, 1);
  });

  it('enabled=falseのときはスクロールを受け付けない', () => {
    const { result } = renderHook(
      ({ enabled }) => useScrollProgress({ enabled }),
      { initialProps: { enabled: false } },
    );

    act(() => {
      dispatchWheel(500);
      flushFrames(60);
    });

    expect(result.current).toBe(0);
  });

  it('enabledがfalse→trueに切り替わるとスクロールを再開できる', () => {
    const { result, rerender } = renderHook(
      ({ enabled }) => useScrollProgress({ enabled }),
      { initialProps: { enabled: false } },
    );

    act(() => {
      dispatchWheel(500);
      flushFrames(30);
    });
    expect(result.current).toBe(0);

    rerender({ enabled: true });

    act(() => {
      dispatchWheel(100);
      flushFrames(150);
    });

    expect(result.current).toBeCloseTo(0.13, 2);
  });
});
