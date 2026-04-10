import type { Metadata } from 'next';
import Link from 'next/link';
import { Navigation } from '@/components/ui/Navigation';

export const metadata: Metadata = {
  title: 'ブランドストーリー | OAK BARGAIN',
  description:
    'OAK BARGAINのブランドコンセプトと世界観をご紹介。時を旅した輝きに、次の物語を。',
};

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-[#0A0604]">
      <Navigation />

      <header className="flex flex-col items-center justify-center px-6 pt-32 pb-16">
        <p className="text-sm tracking-[0.3em] text-[#8B7355]">
          BRAND STORY
        </p>
        <h1 className="mt-4 text-5xl md:text-7xl font-serif tracking-wider text-[#B8964E]">
          OUR STORY
        </h1>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-12">
        <div className="space-y-12">
          <div>
            <h2 className="text-2xl font-serif tracking-wider text-[#B8964E]">
              時を旅した輝きに、次の物語を
            </h2>
            <p className="mt-6 text-base leading-loose text-[#C4956A]">
              OAK BARGAINは、ヴィンテージジュエリーに新しい命を吹き込むブランドです。
              時を経てなお輝き続けるジュエリーには、それぞれに固有の歴史と物語があります。
              私たちは、その物語を次の持ち主へとつなぐ架け橋でありたいと考えています。
            </p>
          </div>

          <div className="painting-filter aspect-[16/9] w-full rounded-lg bg-gradient-to-br from-[#2C1A0E] via-[#B8964E]/30 to-[#0A0604]" />

          <div>
            <h2 className="text-2xl font-serif tracking-wider text-[#B8964E]">
              大樹のように
            </h2>
            <p className="mt-6 text-base leading-loose text-[#C4956A]">
              ブランド名「OAK BARGAIN」の「OAK（オーク）」は、堅牢で長寿な樫の木に由来しています。
              年輪を重ねるごとに強くなり、深い味わいを増していく大樹のように、
              時を経たジュエリーにこそ宿る価値を大切にしています。
            </p>
            <p className="mt-4 text-base leading-loose text-[#C4956A]">
              花・葉・枝・幹——大樹を構成するすべての要素が、
              それぞれの役割と美しさを持つように、
              OAK BARGAINの4つのラインはそれぞれが独自の魅力を持っています。
            </p>
          </div>

          <div>
            <h2 className="text-2xl font-serif tracking-wider text-[#B8964E]">
              出会いの場
            </h2>
            <p className="mt-6 text-base leading-loose text-[#C4956A]">
              OAK BARGAINでは、オンライン販売は行っておりません。
              それは、ジュエリーとの出会いは五感で感じていただきたいから。
              実店舗やポップアップイベントでの特別な出会いを大切にしています。
            </p>
            <p className="mt-4 text-base leading-loose text-[#C4956A]">
              手に取った瞬間の重み、光にかざした時の輝き、
              肌に触れた時の温もり——
              画面越しでは伝わらない、そのジュエリーだけが持つ魅力を、
              ぜひ直接お確かめください。
            </p>
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
