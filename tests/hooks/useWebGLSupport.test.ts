import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useWebGLSupport } from '@/hooks/useWebGLSupport';

describe('useWebGLSupport', () => {
  const originalCreateElement = document.createElement.bind(document);

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('WebGLがサポートされている場合trueを返す', () => {
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: vi.fn().mockReturnValue({}),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(true);
  });

  it('WebGLがサポートされていない場合falseを返す', () => {
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        return {
          getContext: vi.fn().mockReturnValue(null),
        } as unknown as HTMLCanvasElement;
      }
      return originalCreateElement(tagName);
    });

    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });

  it('例外が発生した場合falseを返す', () => {
    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'canvas') {
        throw new Error('Canvas not supported');
      }
      return originalCreateElement(tagName);
    });

    const { result } = renderHook(() => useWebGLSupport());
    expect(result.current).toBe(false);
  });
});
