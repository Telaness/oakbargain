import type { Metadata } from 'next';
import { LINE_CONFIGS } from '@/lib/constants';
import { LinePageContent } from '@/components/sections/LinePageContent';

export const metadata: Metadata = {
  title: `${LINE_CONFIGS.luxury.name} | OAK BARGAIN`,
  description: LINE_CONFIGS.luxury.description,
};

export default function LuxuryLinePage() {
  return <LinePageContent config={LINE_CONFIGS.luxury} />;
}
