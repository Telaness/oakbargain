import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';

export const metadata: Metadata = {
  title: 'アクセス・店舗情報 | OAK BARGAIN',
  description:
    'OAK BARGAINの実店舗・ポップアップイベント情報。ヴィンテージジュエリーとの特別な出会いをお届けします。',
};

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-[#0A0604]">
      <Navigation />

      <header className="flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <p className="text-sm tracking-[0.3em] text-[#8B7355]">
          ACCESS & SHOP
        </p>
        <h1 className="mt-4 text-5xl md:text-7xl font-serif tracking-wider text-[#B8964E]">
          ACCESS
        </h1>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* 店舗情報 */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-serif tracking-wider text-[#B8964E]">
            店舗情報
          </h2>

          <div className="rounded-lg border border-[#2C1A0E] p-8">
            <h3 className="text-xl font-serif tracking-wider text-[#C4956A]">
              OAK BARGAIN 本店
            </h3>
            <div className="mt-6 space-y-3 text-sm text-[#8B7355]">
              <p>
                <span className="inline-block w-24 text-[#6B5B45]">住所</span>
                〒150-0001 東京都渋谷区神宮前X-XX-XX
              </p>
              <p>
                <span className="inline-block w-24 text-[#6B5B45]">営業時間</span>
                11:00 - 19:00
              </p>
              <p>
                <span className="inline-block w-24 text-[#6B5B45]">定休日</span>
                毎週水曜日
              </p>
              <p>
                <span className="inline-block w-24 text-[#6B5B45]">電話</span>
                03-XXXX-XXXX
              </p>
            </div>
          </div>
        </div>

        {/* Googleマップ埋め込み領域 */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-serif tracking-wider text-[#B8964E]">
            MAP
          </h2>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg border border-[#2C1A0E] bg-[#1A0E00] flex items-center justify-center">
            <p className="text-sm text-[#6B5B45]">
              Google Map（実装時に埋め込み）
            </p>
          </div>
        </div>

        {/* ポップアップ情報 */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-serif tracking-wider text-[#B8964E]">
            ポップアップイベント
          </h2>
          <div className="space-y-4">
            <div className="rounded-lg border border-[#2C1A0E] p-6">
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:gap-6">
                <span className="text-sm tracking-wider text-[#B8964E]">
                  COMING SOON
                </span>
                <p className="text-sm text-[#8B7355]">
                  次回のポップアップイベント情報は、決まり次第お知らせいたします。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="flex justify-center pb-20">
        <Link
          href="/"
          className="inline-block border border-[#B8964E] px-10 py-4 text-sm tracking-[0.2em] text-[#B8964E] transition-all hover:bg-white/10"
        >
          BACK TO TOP
        </Link>
      </section>
    </div>
  );
}
