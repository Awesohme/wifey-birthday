"use client";

import { useActionState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { loginView } from "./actions";

export function ViewLogin() {
  const [state, formAction, pending] = useActionState(loginView, null);

  return (
    <main className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-[#050d19] px-6 text-center text-[#f7ead1]">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(20,40,78,0.9)_0%,_#070f1d_46%,_#04080f_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-[-18rem] h-[34rem] w-[44rem] -translate-x-1/2 rounded-full bg-[#d6b36b]/14 blur-[150px]"
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="relative z-10 flex w-full max-w-sm flex-col items-center gap-8"
      >
        <div className="flex flex-col items-center gap-3">
          <p className="text-3xl">🤍</p>
          <h1
            className="text-3xl font-black tracking-[-0.03em] text-[#f7ead1]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            This one&apos;s just for you
          </h1>
          <p className="font-serif text-base italic text-[#ecd28a]">
            Enter your password to open your surprise
          </p>
        </div>

        <form action={formAction} className="flex w-full flex-col gap-4">
          <motion.div
            animate={state?.error ? { x: [0, -8, 8, -6, 6, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <input
              type="password"
              name="passcode"
              placeholder="Password"
              required
              autoComplete="current-password"
              className="w-full rounded-xl border border-[#f7ead1]/12 bg-[#f7ead1]/06 px-5 py-3.5 text-center text-[#f7ead1] placeholder:text-[#f7ead1]/30 focus:border-[#d6b36b]/50 focus:outline-none focus:ring-0 transition"
            />
          </motion.div>

          <AnimatePresence>
            {state?.error && (
              <motion.p
                key="err"
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-rose-400"
              >
                {state.error}
              </motion.p>
            )}
          </AnimatePresence>

          <button
            type="submit"
            disabled={pending}
            className="rounded-xl bg-[#d6b36b] px-8 py-3.5 text-sm font-bold uppercase tracking-[0.18em] text-[#050d19] transition hover:bg-[#e8c87a] disabled:opacity-50"
          >
            {pending ? "Opening…" : "Open my surprise"}
          </button>
        </form>
      </motion.div>
    </main>
  );
}
