'use client';

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '@/lib/constants';

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>({
    isMobile: false,
    isTablet: false,
  });

  useEffect(() => {
    const mqMobile = window.matchMedia(
      `(max-width: ${BREAKPOINTS.tablet - 1}px)`
    );
    const mqTablet = window.matchMedia(
      `(min-width: ${BREAKPOINTS.tablet}px) and (max-width: ${BREAKPOINTS.pc - 1}px)`
    );

    const update = () => {
      setState({
        isMobile: mqMobile.matches,
        isTablet: mqTablet.matches,
      });
    };

    update();
    mqMobile.addEventListener('change', update);
    mqTablet.addEventListener('change', update);
    return () => {
      mqMobile.removeEventListener('change', update);
      mqTablet.removeEventListener('change', update);
    };
  }, []);

  return state;
};
