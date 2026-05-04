// ===== SEO サイト共通設定 =====
// 本番ドメインは環境変数 NEXT_PUBLIC_SITE_URL で上書き可能。
// 末尾スラッシュ無しの絶対URLを指定すること。
const RAW_SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://oakbargain.jp';

export const SITE_URL = RAW_SITE_URL.replace(/\/$/, '');

export const SITE_CONFIG = {
  name: 'OAK BARGAIN',
  shortName: 'OAK BARGAIN',
  url: SITE_URL,
  locale: 'ja_JP',
  defaultTitle: 'OAK BARGAIN | 時を旅した輝きに、次の物語を',
  titleTemplate: '%s | OAK BARGAIN',
  description:
    'ヴィンテージジュエリーブランド OAK BARGAIN。時を経て受け継がれてきたジュエリーの魅力を、現代の感性で再提案。LUXURY/PREMIUM/STANDARD/ENTRYの4ラインで、あなたの物語に寄り添う一点ものをお届けします。',
  keywords: [
    'OAK BARGAIN',
    'オークバーゲン',
    'ヴィンテージジュエリー',
    'アンティークジュエリー',
    'ジュエリーブランド',
    '柏',
    '千葉',
    '古来堂',
    'K18',
    'プラチナ',
  ],
  ogImage: {
    url: '/img/oakbargain-fav.jpg',
    width: 1200,
    height: 630,
    alt: 'OAK BARGAIN | 時を旅した輝きに、次の物語を',
  },
  twitter: {
    card: 'summary_large_image' as const,
  },
  organization: {
    legalName: 'OAK BARGAIN',
    address: {
      streetAddress: '旭町7丁目3-8 サンモール柏1F',
      addressLocality: '柏市',
      addressRegion: '千葉県',
      postalCode: '277-0852',
      addressCountry: 'JP',
    },
    telephone: '0120-619-476',
    email: 'oakbargain@gmail.com',
    geo: { latitude: 35.8616822, longitude: 139.9571382 },
    openingHours: 'Mo,Tu,Th,Fr,Sa,Su 10:00-18:00',
    branchOf: '古来堂 柏旭町店',
  },
} as const;

// 絶対URLを生成する小ユーティリティ。
export const absoluteUrl = (path = '/'): string => {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${normalized}`;
};
