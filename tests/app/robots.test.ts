import { describe, it, expect } from 'vitest';
import robots from '@/app/robots';
import { SITE_URL } from '@/lib/seo';

describe('robots', () => {
  it('sitemap URL がサイトドメインを指している', () => {
    const result = robots();
    expect(result.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
  });

  it('全 User-Agent に対するルールが含まれる', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === '*');
    expect(wildcard).toBeDefined();
    expect(wildcard?.allow).toBe('/');
  });

  it('内部パス (/api/, /_next/) を disallow している', () => {
    const result = robots();
    const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
    const wildcard = rules.find((r) => r.userAgent === '*');
    const disallow = Array.isArray(wildcard?.disallow)
      ? wildcard?.disallow
      : [wildcard?.disallow];
    expect(disallow).toContain('/api/');
    expect(disallow).toContain('/_next/');
  });
});
