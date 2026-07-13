"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Mail, Loader2, MailCheck, ArrowLeft, Info } from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";

import { auth } from "@/lib/firebase";
import Logo from "@/components/ui/Logo";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleReset = async () => {
    setError(null);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-950">
      <div className="p-6">
        <Logo />
      </div>

      <div className="flex-1 flex items-center justify-center px-4 pb-16">
        <div
          className={`w-full max-w-sm transition-opacity duration-500 ${
            mounted ? "opacity-100" : "opacity-0"
          }`}
        >
          {!success ? (
            <>
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Forgot your password?
                </h1>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Enter your email and we'll send you a reset link.
                </p>
              </div>

              {error && (
                <div className="mb-5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                  {error}
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleReset()}
                  disabled={loading}
                  className="w-full pl-11 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-colors"
                />
              </div>

              <button
                onClick={handleReset}
                disabled={loading}
                className="mt-4 w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2.5 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending link…
                  </>
                ) : (
                  "Send reset link"
                )}
              </button>

              <Link
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to sign in
              </Link>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto grid place-items-center w-14 h-14 rounded-full bg-green-50 dark:bg-green-950/40 text-green-600 dark:text-green-400">
                <MailCheck className="w-7 h-7" />
              </div>
              <h1 className="mt-5 text-2xl font-bold text-gray-900 dark:text-white">
                Check your email
              </h1>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                We sent a password reset link to{" "}
                <span className="font-medium text-gray-900 dark:text-white">{email}</span>.
                Follow the instructions in the email to reset your password.
              </p>

              <div className="mt-6 flex items-start gap-2.5 rounded-lg bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 px-3.5 py-3 text-xs text-gray-500 dark:text-gray-400 text-left">
                <Info className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Didn't get it? Check your spam folder, or wait a couple of
                  minutes and try again.
                </span>
              </div>

              <Link
                href="/login"
                className="mt-6 inline-flex w-full items-center justify-center gap-1.5 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-2.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Back to sign in
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
