"use client";

import Link from "next/link";
import { useActionState } from "react";
import { login, type LoginState } from "./actions";

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(
    login,
    undefined
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-foreground p-4">
      <form action={action} className="w-full max-w-sm rounded-xl bg-surface p-8">
        <p className="text-center font-serif text-2xl font-bold">CHICAGO OUTLET</p>
        <p className="mb-6 text-center text-sm text-muted">Админ удирдлага</p>

        <input type="hidden" name="next" value={next} />

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium">Имэйл</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            placeholder="admin@chicagooutlet.mn"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none"
          />
        </label>

        <label className="block">
          <span className="mb-1 block text-xs font-medium">Нууц үг</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full rounded-md border bg-background px-3 py-2.5 text-sm outline-none"
          />
        </label>

        {state?.error && <p className="mt-3 text-sm text-danger">{state.error}</p>}

        <button
          disabled={pending}
          className="mt-4 w-full rounded-md bg-foreground py-3 text-sm font-semibold text-white hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
        </button>

        <Link
          href="/"
          className="mt-4 block text-center text-xs text-accent-dark underline"
        >
          ← Дэлгүүр рүү буцах
        </Link>
      </form>
    </div>
  );
}
