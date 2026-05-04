import { describe, it, expect } from 'vitest';
import sitemap from '@/app/sitemap';
import { SITE_URL } from '@/lib/seo';

describe('sitemap', () => {
  it('主要ページ (/、/story、/access) を含む', () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/`);
    expect(urls).toContain(`${SITE_URL}/story`);
    expect(urls).toContain(`${SITE_URL}/access`);
  });

  it('全エントリにlastModified/changeFrequency/priorityが設定されている', () => {
    const entries = sitemap();
    entries.map((entry) => {
      expect(entry.lastModified).toBeDefined();
      expect(entry.changeFrequency).toBeDefined();
      expect(typeof entry.priority).toBe('number');
    });
  });

  it('priority は 0〜1 の範囲', () => {
    const entries = sitemap();
    entries.map((entry) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    });
  });

  it('トップページの priority が最大', () => {
    const entries = sitemap();
    const top = entries.find((e) => e.url === `${SITE_URL}/`);
    expect(top?.priority).toBe(1.0);
  });
});
