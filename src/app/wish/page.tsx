import type { Metadata } from "next";
import Link from "next/link";
import { HER_NAME } from "@/lib/config";
import { WishForm } from "@/components/wish/wish-form";

export const metadata: Metadata = {
  title: `The midnight post office for ${HER_NAME}`,
  description: `Send ${HER_NAME} a birthday letter, voice note, film, or photograph.`,
};

const postalSteps = [
  ["01", "Write the thing only you would know to say."],
  ["02", "Tuck in a voice, film, or photograph if words feel too small."],
  ["03", "Seal it. It stays private until it joins her birthday journey."],
] as const;

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
          Post for {HER_NAME}
        </p>
      </nav>

      <div className="relative mx-auto mt-12 grid max-w-6xl gap-12 lg:mt-20 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
        <aside className="lg:sticky lg:top-10 lg:self-start">
          <p className="text-[0.68rem] uppercase tracking-[0.38em] text-[#ecd28a]/72">
            Open after midnight · 22 June
          </p>
          <h1
            className="mt-6 max-w-lg text-[clamp(3.7rem,8vw,7.4rem)] leading-[0.78] tracking-[-0.055em]"
            style={{ fontFamily: "var(--font-serif)" }}
          >
            The midnight
            <em className="mt-3 block pl-[0.48em] text-[#8ba5ff]">
              post office.
            </em>
          </h1>
          <p className="mt-8 max-w-md text-sm leading-7 text-[#f5eddc]/58 sm:text-base">
            There is one desk open tonight, and every letter leaving it is
            addressed to {HER_NAME}. No perfect birthday speech required. Just
            send a piece of your actual history with her.
          </p>

          <div className="mt-10 max-w-md border-y border-[#f5eddc]/13 py-2">
            {postalSteps.map(([number, copy]) => (
              <div
                key={number}
                className="grid grid-cols-[2rem_1fr] gap-3 border-b border-[#f5eddc]/10 py-4 last:border-b-0"
              >
                <span className="text-[0.65rem] tracking-[0.2em] text-[#ecd28a]/65">
                  {number}
                </span>
                <p className="text-sm leading-6 text-[#f5eddc]/48">{copy}</p>
              </div>
            ))}
          </div>

          <div
            aria-hidden
            className="wish-postmark mt-12 hidden size-32 rotate-[-12deg] items-center justify-center rounded-full border border-[#8ba5ff]/38 text-center text-[0.58rem] uppercase leading-5 tracking-[0.24em] text-[#8ba5ff]/55 lg:flex"
          >
            Lagos
            <br />
            night mail
            <br />
            22 · 06 · 26
          </div>
        </aside>

        <WishForm />
      </div>
    </main>
  );
}
