"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Eye, EyeOff, HeartHandshake, X } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthDialogProps = { open: boolean; onClose: () => void };

export function AuthDialog({ open, onClose }: AuthDialogProps) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      setMessage("");
      setPassword("");
    }
  }, [open]);

  if (!open) return null;

  async function handleEmailSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) {
      setMessage("Sign-in is not connected yet. Add your Supabase project details to enable it.");
      return;
    }
    setBusy(true);
    setMessage("");
    const result = mode === "signin"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
    setBusy(false);
    if (result.error) {
      setMessage(result.error.message);
      return;
    }
    if (mode === "signup" && !result.data.session) {
      setMessage("Check your inbox for a confirmation link. You can keep using the check-in while you wait.");
    } else {
      onClose();
    }
  }

  async function handleGoogle() {
    if (!supabase) {
      setMessage("Google sign-in is not connected yet. Add your Supabase project details first.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setBusy(false);
    if (error) setMessage(error.message);
  }

  return (
    <div className="dialog-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="auth-dialog" role="dialog" aria-modal="true" aria-labelledby="auth-title">
        <button className="icon-button dialog-close" type="button" onClick={onClose} aria-label="Close sign-in window"><X size={19} /></button>
        <div className="auth-mark"><HeartHandshake size={22} aria-hidden="true" /></div>
        <button className="back-link" type="button" onClick={onClose}><ArrowLeft size={15} /> Back to your check-in</button>
        <p className="eyebrow">YOUR SPACE, YOUR CHOICE</p>
        <h2 id="auth-title">{mode === "signin" ? "Welcome back" : "Save a little space for yourself"}</h2>
        <p className="dialog-intro">Sign in only if you want to save selected moods and activities. Your private note is never saved.</p>
        <button className="google-button" type="button" onClick={handleGoogle} disabled={busy}>
          <GoogleMark /> Continue with Google
        </button>
        <div className="or-divider"><span>or use email</span></div>
        <form className="auth-form" onSubmit={handleEmailSubmit}>
          <label htmlFor="auth-email">Email</label>
          <input id="auth-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="you@example.com" />
          <label htmlFor="auth-password">Password</label>
          <div className="password-field">
            <input id="auth-password" type={showPassword ? "text" : "password"} autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required placeholder="At least 6 characters" />
            <button className="password-toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
          </div>
          {message && <p className="form-message" role="status">{message}</p>}
          <button className="button button-primary auth-submit" type="submit" disabled={busy}>{busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}</button>
        </form>
        <p className="auth-switch">{mode === "signin" ? "New here?" : "Already have an account?"} <button type="button" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setMessage(""); }}>{mode === "signin" ? "Create an account" : "Sign in"}</button></p>
        <p className="auth-footnote">You can always use the activities without signing in.</p>
      </section>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg className="google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-2 3.02v2.52h3.24c1.9-1.75 2.98-4.33 2.98-7.37Z" />
      <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.4l-3.24-2.52c-.9.6-2.05.96-3.38.96-2.6 0-4.8-1.75-5.6-4.1H3.05v2.6A10 10 0 0 0 12 22Z" />
      <path fill="#FBBC05" d="M6.4 13.94a6 6 0 0 1 0-3.88V7.46H3.05a10 10 0 0 0 0 9.08l3.35-2.6Z" />
      <path fill="#EA4335" d="M12 5.96c1.47 0 2.78.5 3.82 1.5l2.87-2.86C16.96 2.98 14.7 2 12 2a10 10 0 0 0-8.95 5.46l3.35 2.6c.8-2.35 3-4.1 5.6-4.1Z" />
    </svg>
  );
}
