"use client";

import React from "react";

export default function PixelModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-3 pixel">
      <button
        className="absolute inset-0 bg-black/70"
        onClick={onClose}
        aria-label="close overlay"
      />
      <div
        className="relative w-full max-w-[720px] bg-[#0b1220] text-white p-4 border border-white/15"
        style={{
          boxShadow:
            "0 0 0 2px rgba(255,255,255,0.12) inset, 0 16px 0 rgba(0,0,0,0.35)",
        }}
      >
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="text-sm font-semibold">{title}</div>
          <button
            className="px-3 py-2 bg-white/10 hover:bg-white/15 border border-white/15 text-xs"
            onClick={onClose}
          >
            закрыть
          </button>
        </div>

        <div className="text-sm leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
