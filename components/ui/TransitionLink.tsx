'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface TransitionLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const TransitionLink = ({ href, children, className, onClick }: TransitionLinkProps) => {
  const router = useRouter();

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      onClick?.();

      const wrapper = document.querySelector('[data-page-transition]') as HTMLElement | null;
      if (wrapper) {
        wrapper.style.transition = 'opacity 0.4s ease-in-out';
        wrapper.style.opacity = '0';
      }

      setTimeout(() => {
        router.push(href);
      }, 400);
    },
    [href, router, onClick]
  );

  return (
    <a href={href} onClick={handleClick} className={className}>
      {children}
    </a>
  );
};
