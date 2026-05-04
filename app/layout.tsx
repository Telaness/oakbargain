import type { Metadata, Viewport } from 'next';
import { Cormorant_Garamond, Noto_Serif_JP } from 'next/font/google';
import { SITE_CONFIG, SITE_URL, absoluteUrl } from '@/lib/seo';
import './globals.css';

const cormorant = Cormorant_Garamond({
  variable: '--font-cormorant',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const notoSerifJP = Noto_Serif_JP({
  variable: '--font-noto-serif-jp',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_CONFIG.defaultTitle,
    template: SITE_CONFIG.titleTemplate,
  },
  description: SITE_CONFIG.description,
  keywords: [...SITE_CONFIG.keywords],
  applicationName: SITE_CONFIG.name,
  authors: [{ name: SITE_CONFIG.name, url: SITE_URL }],
  creator: SITE_CONFIG.name,
  publisher: SITE_CONFIG.name,
  category: 'shopping',
  formatDetection: { email: false, address: false, telephone: false },
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/img/oakbargain-fav.jpg',
    shortcut: '/img/oakbargain-fav.jpg',
    apple: '/img/oakbargain-fav.jpg',
  },
  openGraph: {
    type: 'website',
    locale: SITE_CONFIG.locale,
    url: SITE_URL,
    siteName: SITE_CONFIG.name,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: [
      {
        url: SITE_CONFIG.ogImage.url,
        width: SITE_CONFIG.ogImage.width,
        height: SITE_CONFIG.ogImage.height,
        alt: SITE_CONFIG.ogImage.alt,
      },
    ],
  },
  twitter: {
    card: SITE_CONFIG.twitter.card,
    title: SITE_CONFIG.defaultTitle,
    description: SITE_CONFIG.description,
    images: [SITE_CONFIG.ogImage.url],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
};

export const viewport: Viewport = {
  themeColor: '#0A0604',
  width: 'device-width',
  initialScale: 1,
};

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': absoluteUrl('/#organization'),
  name: SITE_CONFIG.name,
  legalName: SITE_CONFIG.organization.legalName,
  url: SITE_URL,
  logo: absoluteUrl(SITE_CONFIG.ogImage.url),
  email: SITE_CONFIG.organization.email,
  telephone: SITE_CONFIG.organization.telephone,
  address: {
    '@type': 'PostalAddress',
    ...SITE_CONFIG.organization.address,
  },
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': absoluteUrl('/#website'),
  name: SITE_CONFIG.name,
  url: SITE_URL,
  inLanguage: 'ja',
  description: SITE_CONFIG.description,
  publisher: { '@id': absoluteUrl('/#organization') },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${cormorant.variable} ${notoSerifJP.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#0A0604] text-[#F0EDE6]">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
