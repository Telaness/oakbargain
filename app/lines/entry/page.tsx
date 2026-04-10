import type { Metadata } from 'next';
import { LINE_CONFIGS } from '@/lib/constants';
import { LinePageContent } from '@/components/sections/LinePageContent';

export const metadata: Metadata = {
  title: `${LINE_CONFIGS.entry.name} | OAK BARGAIN`,
  description: LINE_CONFIGS.entry.description,
};

export default function EntryLinePage() {
  return <LinePageContent config={LINE_CONFIGS.entry} />;
}
