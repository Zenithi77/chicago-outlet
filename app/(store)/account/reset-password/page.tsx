"use client";

import { useActionState } from "react";
import { resetPassword, type AuthState } from "../actions";
import { classNames } from "@/lib/utils";

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

export default function ResetPasswordPage() {
  const [state, action, pending] = useActionState<AuthState, FormData>(
    resetPassword,
    undefined
  );

  return (
    <div className="container-page flex justify-center py-16">
      <div className="w-full max-w-sm rounded-3xl border bg-surface p-8 shadow-lg space-y-6">
        <div>
          <p className="font-serif text-2xl font-bold">Шинэ нууц үг</p>
          <p className="mt-1 text-sm text-muted">Шинэ нууц үгээ доор оруулна уу.</p>
        </div>

        {state?.message ? (
          <div className="space-y-4">
            <Alert state={state} />
            <a
              href="/account"
              className="block w-full rounded-xl bg-foreground py-3.5 text-center text-sm font-semibold text-white hover:bg-accent hover:text-foreground"
            >
              Нэвтрэх
            </a>
          </div>
        ) : (
          <form action={action} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted">
                Шинэ нууц үг
              </span>
              <input
                name="password"
                type="password"
                autoComplete="new-password"
                placeholder="Дор хаяж 8 тэмдэгт"
                minLength={8}
                required
                className="w-full rounded-xl border border-black/10 bg-background px-4 py-3 text-sm outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/30"
              />
            </label>
            <Alert state={state} />
            <button
              disabled={pending}
              className="w-full rounded-xl bg-foreground py-3.5 text-sm font-semibold text-white transition hover:bg-accent hover:text-foreground disabled:opacity-60"
            >
              {pending ? "Хадгалж байна…" : "Нууц үг шинэчлэх"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
