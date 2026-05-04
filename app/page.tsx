import type { Metadata } from 'next';
import { HomeContent } from '@/components/sections/HomeContent';
import { SITE_CONFIG } from '@/lib/seo';

export const metadata: Metadata = {
  title: SITE_CONFIG.defaultTitle,
  description: SITE_CONFIG.description,
  alternates: { canonical: '/' },
  openGraph: {
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    url: '/',
    type: 'website',
  },
};

export default function HomePage() {
  return <HomeContent />;
}
