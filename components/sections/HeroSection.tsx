'use client';

interface HeroSectionProps {
  visible: boolean;
}

export const HeroSection = ({ visible }: HeroSectionProps) => {
  if (!visible) return null;

  return (
    <section className="pointer-events-none fixed inset-0 z-10 flex flex-col items-end justify-end pb-16 pr-8 md:pb-20 md:pr-16">
      <p className="mb-2 text-xs tracking-[0.3em] text-[#8B7355] animate-fade-in">
        VINTAGE JEWELRY BRAND
      </p>
      <h2 className="text-3xl md:text-5xl font-serif tracking-[0.2em] text-[#B8964E] animate-fade-in-delay">
        OAK BARGAIN
      </h2>
      <p className="mt-3 text-sm md:text-base tracking-[0.15em] text-[#C4956A] animate-fade-in-delay-2">
        時を旅した輝きに、次の物語を
      </p>
      <div className="mt-8 animate-bounce text-[#8B7355]">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
        >
          <path d="M12 5v14M19 12l-7 7-7-7" />
        </svg>
      </div>
    </section>
  );
};
