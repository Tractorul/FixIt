"use client";

import React, { useState } from "react";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  Terminal,
  Lock,
  Mail,
  Key,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isConfigured] = useState(() => isSupabaseConfigured());

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Please enter both email and password.");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    const supabase = createClient();
    if (!supabase) {
      setErrorMessage("Supabase is not configured yet. Please check your environment variables.");
      setIsLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password.trim(),
      });
      if (error) throw error;

      // Redirect to dashboard
      router.push("/");
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Authentication failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-[#070a12] text-zinc-100 px-4 sm:px-6 selection:bg-sky-500/30 selection:text-sky-200">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 to-blue-600/10 border border-sky-500/30 text-sky-400 shadow-xl mb-1">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
            FixIt Access Guard
          </h1>
          <p className="text-xs text-zinc-400">
            Password protected Linux diagnostics & code debugger
          </p>
        </div>

        {/* Not Configured Warning Card (Helpful for fresh deployments) */}
        {!isConfigured && (
          <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 space-y-2 text-xs animate-in fade-in duration-200">
            <div className="flex items-center gap-2 font-semibold text-amber-300">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Supabase Auth Not Configured</span>
            </div>
            <p className="leading-relaxed">
              Add your Supabase URL & Anon Key to <code className="bg-black/40 px-1 py-0.5 rounded font-mono text-amber-100">.env.local</code> and in Vercel Environment Variables:
            </p>
            <div className="bg-black/60 p-2.5 rounded font-mono text-[11px] text-amber-300 overflow-x-auto space-y-0.5">
              <div>NEXT_PUBLIC_SUPABASE_URL=https://xyz.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...</div>
            </div>
            <a
              href="https://supabase.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sky-400 hover:text-sky-300 font-medium underline pt-1"
            >
              Get free Supabase keys <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {/* Auth Card */}
        <div className="glass-panel p-6 sm:p-8 rounded-2xl shadow-2xl border border-white/10 space-y-6">
          {/* Error / Success messages */}
          {errorMessage && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {successMessage && (
            <div className="p-3 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-200 text-xs flex items-start gap-2 animate-in fade-in duration-150">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="flex-1">{successMessage}</div>
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            {/* Email Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-sky-400" /> Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@example.com"
                  required
                  className="w-full bg-[#05080f] border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/60 font-mono"
                />
              </div>
            </div>

            {/* Password Input */}
            <div className="space-y-1.5">
              <label className="text-[11px] uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5">
                <Key className="w-3 h-3 text-sky-400" /> Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full bg-[#05080f] border border-white/10 rounded-xl pl-3.5 pr-10 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-sky-500/60 font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors"
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !isConfigured}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg mt-2 ${
                isLoading || !isConfigured
                  ? "bg-zinc-800 text-zinc-500 cursor-not-allowed border border-white/5"
                  : "bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white border border-sky-400/30 hover:shadow-sky-500/20"
              }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Sign In with Password</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </form>

          {/* Note indicating admin-only creation */}
          <div className="pt-2 text-center text-[11px] text-zinc-500 border-t border-white/5 font-mono">
            <span>Users are managed directly in your Supabase Dashboard</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-zinc-600 font-mono flex items-center justify-center gap-1.5">
          <Terminal className="w-3 h-3 text-sky-400" />
          <span>FixIt Auth Protected • Supabase Secured</span>
        </div>
      </div>
    </div>
  );
}
