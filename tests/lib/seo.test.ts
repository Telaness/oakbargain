import { describe, it, expect } from 'vitest';
import { SITE_CONFIG, SITE_URL, absoluteUrl } from '@/lib/seo';

describe('SITE_URL', () => {
  it('絶対URLである', () => {
    expect(SITE_URL).toMatch(/^https?:\/\//);
  });

  it('末尾スラッシュを含まない', () => {
    expect(SITE_URL.endsWith('/')).toBe(false);
  });
});

describe('SITE_CONFIG', () => {
  it('必須プロパティが揃っている', () => {
    const requiredKeys = [
      'name',
      'url',
      'locale',
      'defaultTitle',
      'titleTemplate',
      'description',
      'keywords',
      'ogImage',
      'twitter',
      'organization',
    ];
    requiredKeys.map((key) => expect(SITE_CONFIG).toHaveProperty(key));
  });

  it('keywordsは1つ以上のキーワードを含む', () => {
    expect(SITE_CONFIG.keywords.length).toBeGreaterThan(0);
  });

  it('ogImageが幅と高さを持つ', () => {
    expect(SITE_CONFIG.ogImage.width).toBeGreaterThan(0);
    expect(SITE_CONFIG.ogImage.height).toBeGreaterThan(0);
  });

  it('locale が ja_JP', () => {
    expect(SITE_CONFIG.locale).toBe('ja_JP');
  });

  it('descriptionが長すぎない (160文字以内推奨)', () => {
    expect(SITE_CONFIG.description.length).toBeLessThanOrEqual(200);
  });

  it('organization.address が postalCode/addressCountry を含む', () => {
    expect(SITE_CONFIG.organization.address.postalCode).toMatch(/^\d{3}-\d{4}$/);
    expect(SITE_CONFIG.organization.address.addressCountry).toBe('JP');
  });
});

describe('absoluteUrl', () => {
  it('スラッシュなしのパスでも先頭にスラッシュを付けて結合する', () => {
    expect(absoluteUrl('story')).toBe(`${SITE_URL}/story`);
  });

  it('スラッシュ付きのパスをそのまま結合する', () => {
    expect(absoluteUrl('/story')).toBe(`${SITE_URL}/story`);
  });

  it('引数省略時はサイトトップを返す', () => {
    expect(absoluteUrl()).toBe(`${SITE_URL}/`);
  });
});
