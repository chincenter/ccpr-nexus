"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { requestPasswordReset } from "./actions";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-semibold text-slate-900">Reset your password</h1>

        {sent ? (
          <p className="mt-4 text-sm text-slate-600">
            If an account exists for that email, a password reset link has been sent. Check your
            inbox (and spam folder).
          </p>
        ) : (
          <form
            action={(formData: FormData) => {
              startTransition(async () => {
                await requestPasswordReset(formData);
                setSent(true);
              });
            }}
            className="mt-6 space-y-4"
          >
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-teal-600 focus:outline-none focus:ring-1 focus:ring-teal-600"
              />
            </div>
            <button
              type="submit"
              disabled={isPending}
              className="w-full rounded-md bg-teal-700 px-3 py-2 text-sm font-medium text-white hover:bg-teal-800 disabled:opacity-60"
            >
              {isPending ? "Sending…" : "Send reset link"}
            </button>
          </form>
        )}

        <Link href="/login" className="mt-4 block text-center text-sm text-slate-500 hover:underline">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
