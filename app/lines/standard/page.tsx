import type { Metadata } from 'next';
import { LINE_CONFIGS } from '@/lib/constants';
import { LinePageContent } from '@/components/sections/LinePageContent';

export const metadata: Metadata = {
  title: `${LINE_CONFIGS.standard.name} | OAK BARGAIN`,
  description: LINE_CONFIGS.standard.description,
};

export default function StandardLinePage() {
  return <LinePageContent config={LINE_CONFIGS.standard} />;
}
