import type { Metadata } from "next";
import Link from "next/link";
import { WishForm } from "@/components/wish/wish-form";
import { isUnlocked } from "@/lib/config";

const WISH_RECIPIENT = "Cynthia";

export const metadata: Metadata = {
  title: `The midnight post office for ${WISH_RECIPIENT}`,
  description: `Send ${WISH_RECIPIENT} a birthday letter, voice note, film, or photograph.`,
};

export const dynamic = "force-dynamic";

export default function WishPage() {
  const locked = !isUnlocked();

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

      {locked ? (
        <div className="relative mx-auto mt-10 w-full max-w-2xl lg:mt-16">
          <WishForm />
        </div>
      ) : (
        <div className="relative mx-auto mt-24 flex max-w-xl flex-col items-center gap-6 text-center lg:mt-32">
          <p className="text-4xl">🤍</p>
          <h1
            className="text-[clamp(1.8rem,6vw,3rem)] font-black leading-tight tracking-[-0.03em] text-[#f7ead1]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Thank you for all the well wishes and love
          </h1>
          <p className="font-serif text-lg italic text-[#ecd28a]">
            {WISH_RECIPIENT} is feeling it.
          </p>
          <p className="mt-2 text-[0.65rem] uppercase tracking-[0.4em] text-[#f5eddc]/38">
            Wishes are now closed
          </p>
        </div>
      )}
    </main>
  );
}
