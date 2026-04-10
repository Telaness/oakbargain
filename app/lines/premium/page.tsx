import type { Metadata } from 'next';
import { LINE_CONFIGS } from '@/lib/constants';
import { LinePageContent } from '@/components/sections/LinePageContent';

export const metadata: Metadata = {
  title: `${LINE_CONFIGS.premium.name} | OAK BARGAIN`,
  description: LINE_CONFIGS.premium.description,
};

export default function PremiumLinePage() {
  return <LinePageContent config={LINE_CONFIGS.premium} />;
}
