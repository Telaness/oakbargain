import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0A0604]">
      <h1 className="text-6xl font-serif tracking-wider text-[#B8964E]">404</h1>
      <p className="mt-4 text-sm tracking-[0.2em] text-[#8B7355]">
        ページが見つかりませんでした
      </p>
      <Link
        href="/"
        className="mt-8 inline-block border border-[#B8964E] px-8 py-3 text-sm tracking-[0.2em] text-[#B8964E] transition-all hover:bg-white/10"
      >
        BACK TO TOP
      </Link>
    </div>
  );
}
