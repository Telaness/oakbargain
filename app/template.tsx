'use client';

import { useEffect, useState } from 'react';

export default function Template({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // 次フレームでフェードイン開始
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      data-page-transition
      style={{
        opacity: mounted ? 1 : 0,
        transition: 'opacity 0.6s ease-in-out',
      }}
    >
      {children}
    </div>
  );
}
