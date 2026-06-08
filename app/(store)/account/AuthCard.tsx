"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { login, signup, forgotPassword, verifyOtp, resetPassword, type AuthState } from "./actions";
import { classNames } from "@/lib/utils";
import { CheckIcon, ArrowLeftIcon } from "@/components/Icons";

const HIGHLIGHTS = [
  "100% жинхэнэ брэндийн бараа",
  "Хурдан хүргэлт, асуудалгүй буцаалт",
  "Зөвхөн гишүүдэд зориулсан хямдрал",
];

export function AuthCard({ next }: { next: string }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");

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
                    <CheckIcon className="h-3.5 w-3.5" />
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

          {/* Forgot password panel */}
          {mode === "forgot" && (
            <div className="space-y-4">
              <button
                onClick={() => setMode("login")}
                className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground"
              >
                <ArrowLeftIcon className="h-4 w-4" /> Буцах
              </button>
              <div>
                <h2 className="font-serif text-xl font-bold">Нууц үг мартсан</h2>
                <p className="mt-1 text-sm text-muted">И-мэйлд нууц үг шинэчлэх холбоос илгээнэ.</p>
              </div>
              <ForgotPanel onDone={() => setMode("login")} />
            </div>
          )}

          {/* Tabs */}
          <div className={classNames("relative mb-8 flex rounded-full bg-background p-1 text-sm font-semibold", mode === "forgot" ? "hidden" : "")}>
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

          {mode === "login" && (
            <LoginPanel next={next} onForgot={() => setMode("forgot")} />
          )}
          {mode === "register" && (
            <RegisterPanel next={next} onDone={() => setMode("login")} />
          )}

          <Link
            href="/"
            className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-muted underline-offset-4 hover:text-foreground hover:underline"
          >
            <ArrowLeftIcon className="h-3.5 w-3.5" /> Дэлгүүр рүү буцах
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

function LoginPanel({ next, onForgot }: { next: string; onForgot: () => void }) {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    login,
    undefined
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="И-мэйл" name="email" type="email" autoComplete="email" placeholder="та@example.mn" required />
      <Field label="Нууц үг" name="password" type="password" autoComplete="current-password" placeholder="••••••••" required />
      <div className="text-right">
        <button type="button" onClick={onForgot} className="text-xs text-muted hover:text-foreground underline">
          Нууц үг мартсан?
        </button>
      </div>
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

function ForgotPanel({ onDone }: { onDone: () => void }) {
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "password">("email");

  // Step 1: send OTP
  const [sendState, sendAction, sendPending] = useActionState<AuthState, FormData>(forgotPassword, undefined);
  // Step 2: verify OTP
  const [otpState, otpAction, otpPending] = useActionState<AuthState, FormData>(verifyOtp, undefined);
  // Step 3: set new password
  const [pwState, pwAction, pwPending] = useActionState<AuthState, FormData>(resetPassword, undefined);

  // Advance steps based on action results
  if (sendState?.message === "ok:otp_sent" && step === "email") setStep("otp");
  if (otpState?.message === "ok:verified" && step === "otp") setStep("password");

  return (
    <div className="space-y-4">
      {/* Step 1: Email */}
      {step === "email" && (
        <form action={(fd) => { setEmail(String(fd.get("email") ?? "")); sendAction(fd); }} className="space-y-4">
          <div>
            <p className="font-semibold text-sm">И-мэйл хаягаа оруулна уу</p>
            <p className="text-xs text-muted mt-0.5">Gmail рүү 6 оронтой код илгээнэ.</p>
          </div>
          <Field label="И-мэйл" name="email" type="email" autoComplete="email" placeholder="та@example.mn" required />
          {sendState?.error && <p className="text-xs text-red-500">{sendState.error}</p>}
          <button disabled={sendPending} className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60">
            {sendPending ? "Илгээж байна…" : "Код авах"}
          </button>
        </form>
      )}

      {/* Step 2: OTP code */}
      {step === "otp" && (
        <form action={otpAction} className="space-y-4">
          <div>
            <p className="font-semibold text-sm">Кодоо оруулна уу</p>
            <p className="text-xs text-muted mt-0.5"><span className="font-medium">{email}</span> хаяг руу 6 оронтой код илгээгдлээ.</p>
          </div>
          <input type="hidden" name="email" value={email} />
          <Field label="6 оронтой код" name="token" type="text" inputMode="numeric" maxLength={6} placeholder="123456" required />
          {otpState?.error && <p className="text-xs text-red-500">{otpState.error}</p>}
          <button disabled={otpPending} className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60">
            {otpPending ? "Шалгаж байна…" : "Баталгаажуулах"}
          </button>
          <button type="button" onClick={() => setStep("email")} className="w-full text-xs text-muted underline">
            Код дахин авах
          </button>
        </form>
      )}

      {/* Step 3: New password */}
      {step === "password" && (
        <form action={pwAction} className="space-y-4">
          <div>
            <p className="font-semibold text-sm">Шинэ нууц үг оруулна уу</p>
          </div>
          <Field label="Шинэ нууц үг" name="password" type="password" autoComplete="new-password" placeholder="Дор хаяж 8 тэмдэгт" minLength={8} required />
          {pwState?.error && <p className="text-xs text-red-500">{pwState.error}</p>}
          {pwState?.message === "ok:done" ? (
            <button type="button" onClick={onDone} className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white hover:bg-accent hover:text-foreground">
              ✓ Амжилттай — Нэвтрэх
            </button>
          ) : (
            <button disabled={pwPending} className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60">
              {pwPending ? "Хадгалж байна…" : "Нууц үг шинэчлэх"}
            </button>
          )}
        </form>
      )}
    </div>
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
