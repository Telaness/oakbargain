import type { Metadata } from 'next';
import { Cormorant_Garamond, Noto_Sans_JP } from 'next/font/google';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const notoSansJP = Noto_Sans_JP({
  variable: '--font-noto-sans-jp',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'OAK BARGAIN | 時を旅した輝きに、次の物語を',
  description:
    'ヴィンテージジュエリーブランド OAK BARGAIN。時を経て受け継がれてきたジュエリーの魅力を、現代の感性で再提案。',
  openGraph: {
    title: 'OAK BARGAIN',
    description: '時を旅した輝きに、次の物語を',
    images: [{ url: '/og-image.jpg', width: 1200, height: 630 }],
    type: 'website',
    locale: 'ja_JP',
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${cormorant.variable} ${notoSansJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0604] text-[#F0EDE6]">
        {children}
      </body>
    </html>
  );
}
