import type { Metadata } from 'next';
import { Navigation } from '@/components/ui/Navigation';
import { TransitionLink } from '@/components/ui/TransitionLink';

export const metadata: Metadata = {
  title: 'アクセス・店舗情報 | OAK BARGAIN',
  description:
    'OAK BARGAINの実店舗・ポップアップイベント情報。ヴィンテージジュエリーとの特別な出会いをお届けします。',
};

export default function AccessPage() {
  return (
    <div className="min-h-screen bg-[#0B1A0E]">
      <Navigation />

      <header className="flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <p className="text-sm tracking-[0.3em] text-[#F0EDE6]">
          ACCESS & SHOP
        </p>
        <h1 className="mt-4 text-5xl md:text-7xl font-serif tracking-wider text-[#B8964E]">
          ACCESS
        </h1>
      </header>

      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* 取扱店舗 */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-serif tracking-wider text-[#B8964E]">
            取扱店舗
          </h2>

          <div className="p-8">
            <h3 className="text-xl font-serif tracking-wider text-[#F0EDE6]">
              古来堂 柏旭町店
            </h3>
            <div className="mt-6 space-y-3 text-sm text-[#F0EDE6]">
              <p>
                <span className="inline-block w-24 text-[#B8964E]">住所</span>
                〒277-0852 千葉県柏市旭町７丁目３−８ サンモール柏1F
              </p>
              <p>
                <span className="inline-block w-24 text-[#B8964E]">営業時間</span>
                10:00〜18:00
              </p>
              <p>
                <span className="inline-block w-24 text-[#B8964E]">定休日</span>
                水曜日
              </p>
              <p>
                <span className="inline-block w-24 text-[#B8964E]">電話番号</span>
                0120-619-476
              </p>
              <p>
                <span className="inline-block w-24 text-[#B8964E]">Email</span>
                <a href="mailto:oakbargain@gmail.com" className="underline underline-offset-4 transition-colors hover:text-[#B8964E]">
                  oakbargain@gmail.com
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Googleマップ */}
        <div className="mb-16">
          <h2 className="mb-8 text-2xl font-serif tracking-wider text-[#B8964E]">
            MAP
          </h2>
          <div className="aspect-[16/9] w-full overflow-hidden rounded-lg">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3233.4828588099867!2d139.9571382!3d35.8616822!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x60189c92cd5bffff%3A0xad87b9e35d5f5a0a!2z44K144Oz44Oi44O844Or5p-P!5e0!3m2!1sja!2sjp!4v1776226912998!5m2!1sja!2sjp"
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="古来堂 柏旭町店"
            />
          </div>
        </div>

      </section>

      <section className="flex justify-center pb-20">
        <TransitionLink
          href="/"
          className="inline-block border border-[#B8964E] px-10 py-4 text-sm tracking-[0.2em] text-[#B8964E] transition-all hover:bg-white/10"
        >
          BACK TO TOP
        </TransitionLink>
      </section>
    </div>
  );
}
