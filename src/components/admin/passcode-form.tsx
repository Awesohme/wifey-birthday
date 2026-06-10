"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/admin/actions";

export function PasscodeForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, null);

  return (
    <form
      action={formAction}
      className="w-full max-w-sm space-y-4 rounded-3xl bg-white/80 p-8 shadow-xl shadow-leaf-900/5 backdrop-blur"
    >
      <h1 className="font-display text-xl">Gardener&apos;s entrance 🌿</h1>
      <input
        type="password"
        name="passcode"
        placeholder="Passcode"
        aria-label="Passcode"
        autoFocus
        className="w-full rounded-2xl border border-leaf-900/10 bg-white px-4 py-3 text-base shadow-sm outline-none focus:ring-2 focus:ring-royal-400"
      />
      {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-full bg-royal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-royal-600/25 disabled:opacity-60"
      >
        {pending ? "Checking…" : "Enter"}
      </button>
    </form>
  );
}
