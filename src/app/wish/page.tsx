import type { Metadata } from "next";
import { HER_NAME } from "@/lib/config";
import { WishForm } from "@/components/wish/wish-form";

export const metadata: Metadata = {
  title: `Leave a wish for ${HER_NAME} 🦋`,
  description: `${HER_NAME} turns a year more wonderful on June 22. Leave her a birthday wish: it will hang on her tree until the big day.`,
};

export default function WishPage() {
  return (
    <main className="relative min-h-dvh overflow-hidden bg-gradient-to-b from-royal-50 via-background to-leaf-300/20 px-4 py-10 sm:py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 left-1/2 size-72 -translate-x-1/2 rounded-full bg-royal-200/40 blur-3xl"
      />
      <div className="relative mx-auto max-w-lg">
        <header className="mb-8 text-center">
          <p className="mb-2 text-3xl" aria-hidden>🦋</p>
          <h1 className="font-display text-3xl text-leaf-900 sm:text-4xl">
            A secret is growing for {HER_NAME}
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-foreground/60">
            On <strong className="text-royal-700">June 22</strong>, {HER_NAME} opens a meadow
            where every branch of a tree holds a wish from someone who loves her. Hang yours
            below: a message, your voice, or a memory. <em>Shh, it&apos;s a surprise.</em>
          </p>
        </header>
        <WishForm />
        <p className="mt-6 text-center text-xs text-foreground/40">
          Your wish stays hidden until her birthday. Made with love by her husband. 💙
        </p>
      </div>
    </main>
  );
}
