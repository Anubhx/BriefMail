"use client";

export function BackgroundGridLines() {
  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none max-w-[1200px] mx-auto px-6 md:px-10 z-0 flex justify-between"
    >
      <div className="w-[1px] h-full bg-[var(--border)] opacity-40" />
      <div className="w-[1px] h-full bg-[var(--border)] opacity-30 hidden md:block" />
      <div className="w-[1px] h-full bg-[var(--border)] opacity-30 hidden md:block" />
      <div className="w-[1px] h-full bg-[var(--border)] opacity-40" />
    </div>
  );
}
