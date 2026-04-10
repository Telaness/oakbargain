'use client';

export const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0A0604]">
      <div className="mb-8 text-4xl font-serif tracking-[0.3em] text-[#B8964E] animate-pulse">
        OAK BARGAIN
      </div>
      <div className="text-sm tracking-[0.2em] text-[#8B7355]">
        Loading...
      </div>
      <div className="mt-6 h-[1px] w-32 overflow-hidden bg-[#2C1A0E]">
        <div className="h-full w-full origin-left animate-loading-bar bg-[#B8964E]" />
      </div>
    </div>
  );
};
