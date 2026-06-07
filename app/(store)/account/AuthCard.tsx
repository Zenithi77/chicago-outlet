"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, signup, type AuthState } from "./actions";
import { classNames } from "@/lib/utils";

const HIGHLIGHTS = [
  "100% жинхэнэ брэндийн бараа",
  "Хурдан хүргэлт, асуудалгүй буцаалт",
  "Зөвхөн гишүүдэд зориулсан хямдрал",
];

export function AuthCard({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="grid w-full max-w-4xl overflow-hidden rounded-3xl border border-black/5 bg-surface shadow-[0_30px_80px_-40px_rgba(0,0,0,0.45)] md:grid-cols-2">
        {/* Brand panel */}
        <div className="relative hidden flex-col justify-between overflow-hidden bg-foreground p-10 text-white md:flex">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-accent/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-64 w-64 rounded-full bg-white/10 blur-3xl" />

          <div className="relative">
            <p className="font-serif text-2xl font-bold tracking-[0.12em]">CHICAGO</p>
            <p className="-mt-1 text-[10px] font-medium uppercase tracking-[0.42em] text-accent">
              Outlet
            </p>
          </div>

          <div className="relative">
            <h2 className="font-serif text-3xl font-bold leading-tight">
              Стиль чинь
              <br />
              эндээс эхэлнэ.
            </h2>
            <ul className="mt-6 space-y-3">
              {HIGHLIGHTS.map((h) => (
                <li key={h} className="flex items-center gap-3 text-sm text-white/85">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-accent text-foreground">
                    ✓
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          </div>

          <p className="relative text-xs text-white/50">
            © {new Date().getFullYear()} Chicago Outlet
          </p>
        </div>

        {/* Form panel */}
        <div className="p-8 sm:p-10">
          {/* Mobile brand */}
          <div className="mb-6 text-center md:hidden">
            <p className="font-serif text-xl font-bold tracking-[0.12em]">CHICAGO</p>
            <p className="-mt-1 text-[9px] font-medium uppercase tracking-[0.42em] text-accent-dark">
              Outlet
            </p>
          </div>

          {/* Tabs */}
          <div className="relative mb-8 flex rounded-full bg-background p-1 text-sm font-semibold">
            <span
              className={classNames(
                "absolute inset-y-1 w-[calc(50%-0.25rem)] rounded-full bg-foreground shadow transition-transform duration-300",
                mode === "register" ? "translate-x-[calc(100%+0.5rem)]" : "translate-x-0"
              )}
            />
            <button
              type="button"
              onClick={() => setMode("login")}
              className={classNames(
                "relative z-10 flex-1 rounded-full py-2.5 transition-colors",
                mode === "login" ? "text-white" : "text-muted"
              )}
            >
              Нэвтрэх
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={classNames(
                "relative z-10 flex-1 rounded-full py-2.5 transition-colors",
                mode === "register" ? "text-white" : "text-muted"
              )}
            >
              Бүртгүүлэх
            </button>
          </div>

          {mode === "login" ? (
            <LoginPanel next={next} />
          ) : (
            <RegisterPanel next={next} onDone={() => setMode("login")} />
          )}

          <Link
            href="/"
            className="mt-6 block text-center text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            ← Дэлгүүр рүү буцах
          </Link>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
    </label>
  );
}

function Alert({ state }: { state: AuthState }) {
  if (!state?.error && !state?.message) return null;
  const ok = !!state.message;
  return (
    <p
      className={classNames(
        "rounded-xl px-4 py-3 text-sm",
        ok ? "bg-accent/15 text-accent-dark" : "bg-danger/10 text-danger"
      )}
    >
      {state.message ?? state.error}
    </p>
  );
}

function LoginPanel({ next }: { next: string }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="И-мэйл" name="email" type="email" autoComplete="email" placeholder="та@example.mn" required />
      <Field label="Нууц үг" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      <Alert state={state} />
      <button
        disabled={pending}
        className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60"
      >
        {pending ? "Нэвтэрч байна…" : "Нэвтрэх"}
      </button>
    </form>
  );
}

function RegisterPanel({ next, onDone }: { next: string; onDone: () => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    signup,
    undefined
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Нэр" name="full_name" type="text" autoComplete="name" placeholder="Таны нэр" required />
      <Field label="И-мэйл" name="email" type="email" autoComplete="email" placeholder="та@example.mn" required />
      <Field label="Нууц үг" name="password" type="password" autoComplete="new-password" placeholder="Дор хаяж 8 тэмдэгт" minLength={8} required />
      <Alert state={state} />
      {state?.message ? (
        <button
          type="button"
          onClick={onDone}
          className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground"
        >
          Нэвтрэх рүү очих
        </button>
      ) : (
        <button
          disabled={pending}
          className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60"
        >
          {pending ? "Үүсгэж байна…" : "Бүртгэл үүсгэх"}
        </button>
      )}
    </form>
  );
}
