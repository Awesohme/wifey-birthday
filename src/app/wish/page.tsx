import type { Metadata } from "next";
import Link from "next/link";
import { WishForm } from "@/components/wish/wish-form";

const WISH_RECIPIENT = "Cynthia";

export const metadata: Metadata = {
  title: `The midnight post office for ${WISH_RECIPIENT}`,
  description: `Send ${WISH_RECIPIENT} a birthday letter, voice note, film, or photograph.`,
};

export default function WishPage() {
  return (
    <main className="wish-night relative min-h-dvh overflow-hidden bg-[#06142b] px-4 pb-16 pt-6 text-[#f5eddc] sm:px-6 sm:pb-24 sm:pt-8">
      <div className="wish-night-stars pointer-events-none absolute inset-0" />
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-20 size-[34rem] rounded-full bg-[#244cc5]/20 blur-[130px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-40 top-[38rem] size-[30rem] rounded-full bg-[#d4a93c]/10 blur-[120px]"
      />

      <nav className="relative mx-auto flex max-w-6xl items-center justify-between border-b border-[#f5eddc]/15 pb-5">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#f5eddc]/58 transition hover:text-[#f5eddc]"
        >
          <span
            aria-hidden
            className="transition-transform group-hover:-translate-x-1"
          >
            ←
          </span>
          Celebration
        </Link>
        <p className="font-serif text-lg italic text-[#ecd28a]">
          Post for {WISH_RECIPIENT}
        </p>
      </nav>

      <div className="relative mx-auto mt-10 w-full max-w-2xl lg:mt-16">
        <WishForm />
      </div>
    </main>
  );
}
