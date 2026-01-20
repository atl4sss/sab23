"use client";

import { useEffect } from "react";

export default function IntroOverlay({
  open,
  onEnter,
  onEnableSound,
}: {
  open: boolean;
  onEnter: () => void;
  onEnableSound?: () => void;
}) {
  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter") onEnter();
      if (e.key === "Escape") onEnter();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onEnter]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[2000] pixel">
      <div className="absolute inset-0 bg-black/30" />

      <div className="relative h-full w-full flex items-center justify-center p-5 animate-[fadeIn_300ms_ease-out]">
        <div
          className="w-full max-w-[820px] border border-white/15 px-7 py-6 text-white transition-all duration-300"
          style={{
            background: "linear-gradient(180deg, #6B4D3B 0%, #3E2C23 100%)",
            boxShadow:
              "0 0 0 2px rgba(255,255,255,0.10) inset, 0 18px 40px rgba(0,0,0,0.35)",
          }}
        >
          <div className="text-3xl font-semibold tracking-tight">before you enter</div>

          <div className="mt-2 text-white/90 leading-relaxed text-[15px]">
            i made a tiny room for you.
            <br />
            click objects. open surprises. take your time.
            <br />
            (and yeah… sound on 😌)
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              className="px-4 py-2 bg-[#E5D4BA]/20 hover:bg-[#E5D4BA]/28 border border-white/15 text-sm"
              onClick={onEnter}
            >
              enter ▶
            </button>

            <button
              className="px-4 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-sm"
              onClick={() => onEnableSound?.()}
            >
              enable sound
            </button>

            <div className="text-xs text-white/65">(you can press Enter too)</div>
          </div>
        </div>
      </div>
    </div>
  );
}
