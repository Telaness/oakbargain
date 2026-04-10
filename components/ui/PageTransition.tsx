'use client';

import { useRef, useCallback } from 'react';
import gsap from 'gsap';

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => {
  const curtainRef = useRef<HTMLDivElement>(null);

  return (
    <>
      <div
        ref={curtainRef}
        className="fixed inset-0 z-[100] pointer-events-none bg-[#0A0604]"
        style={{ clipPath: 'inset(0 0 100% 0)' }}
      />
      {children}
    </>
  );
};

export const usePageTransition = () => {
  const curtainRef = useRef<HTMLDivElement | null>(null);

  const setCurtainRef = useCallback((el: HTMLDivElement | null) => {
    curtainRef.current = el;
  }, []);

  const animateOut = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!curtainRef.current) {
        resolve();
        return;
      }
      gsap.to(curtainRef.current, {
        clipPath: 'inset(0 0 0% 0)',
        duration: 0.6,
        ease: 'power2.inOut',
        onComplete: resolve,
      });
    });
  }, []);

  const animateIn = useCallback((): Promise<void> => {
    return new Promise((resolve) => {
      if (!curtainRef.current) {
        resolve();
        return;
      }
      gsap.fromTo(
        curtainRef.current,
        { clipPath: 'inset(0 0 0% 0)' },
        {
          clipPath: 'inset(0 0 100% 0)',
          duration: 0.6,
          ease: 'power2.inOut',
          onComplete: resolve,
        }
      );
    });
  }, []);

  return { setCurtainRef, animateOut, animateIn };
};
