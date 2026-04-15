import type { Metadata } from 'next';
import { Navigation } from '@/components/ui/Navigation';
import { TransitionLink } from '@/components/ui/TransitionLink';

export const metadata: Metadata = {
  title: 'ブランドストーリー | OAK BARGAIN',
  description:
    'OAK BARGAINのブランドコンセプトと世界観をご紹介。時を旅した輝きに、次の物語を。',
};

export default function StoryPage() {
  return (
    <div className="min-h-screen bg-[#0B1A0E]">
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
            <p className="text-base leading-loose text-[#F0EDE6]">
              時を越えてきたものには、
              <br />
              新品にはない美しさがあります。
            </p>
            <p className="mt-6 text-base leading-loose text-[#F0EDE6]">
              傷や艶、重みまでもが、そのジュエリーだけの表情となり、
              <br />
              長い時間の中で刻まれた魅力として残っていく。
            </p>
          </div>

          <div className="aspect-[16/10] w-full overflow-hidden rounded-lg">
            <img
              src="/img/story/story.JPG"
              alt="OAK BARGAIN ブランドイメージ"
              className="h-full w-full object-cover object-[center_60%]"
            />
          </div>

          <div>
            <p className="text-base leading-loose text-[#F0EDE6]">
              OAK BARGAINは、
              <br />
              そんなヴィンテージジュエリーが持つ記憶と存在感を、
              <br />
              現代の感性であらためて届けるブランドです。
            </p>
          </div>

          <div>
            <p className="text-base leading-loose text-[#F0EDE6]">
              私たちが大切にしているのは、
              <br />
              ただ古いものを並べることではありません。
            </p>
            <p className="mt-6 text-base leading-loose text-[#F0EDE6]">
              素材が持つ価値、時を経たからこそ宿る空気、
              <br />
              そしてその瞬間にしか生まれない"出会い"の特別さ。
            </p>
          </div>

          <div>
            <p className="text-base leading-loose text-[#F0EDE6]">
              ヴィンテージジュエリーは、今あるものの中から
              <br />
              自分に合うものと巡り合うこと自体が魅力だと考えています。
            </p>
          </div>

          <div>
            <p className="text-base leading-loose text-[#F0EDE6]">
              だからOAK BARGAINは、オンラインでは販売しません。
            </p>
            <p className="mt-6 text-base leading-loose text-[#F0EDE6]">
              実際に見て、手に取り、試しながら出会う体験までを、
              <br />
              ブランドの価値として大切にしているからです。
            </p>
          </div>

          <div className="border-t border-[#B8964E]/30 pt-12">
            <p className="text-center text-lg font-serif tracking-wider leading-loose text-[#B8964E]">
              時を旅した輝きに、次の物語をつなぐ。
              <br />
              それが、OAK BARGAINです。
            </p>
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
