"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { greyOrangeEmailErrorMessage, isGreyOrangeEmail, normalizeEmail } from "@/lib/email-validation";
import { apiUrl } from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const normalizedEmail = normalizeEmail(email);
    if (!isGreyOrangeEmail(normalizedEmail)) {
      setError(greyOrangeEmailErrorMessage());
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(apiUrl("/api/auth/forgot-password"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to submit your request. Please try again.");
      setSubmitted(true);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Unable to submit your request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main
      id="loginScreen"
      style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 24px", background: "#0b0e14" }}
    >
      <div
        className="login-card"
        style={{ background: "#161b27", borderRadius: "20px", border: "1px solid rgba(255,255,255,0.08)", padding: "40px", width: "100%", maxWidth: "440px", boxShadow: "0 20px 40px rgba(0,0,0,0.3)" }}
      >
        <div style={{ fontSize: "24px", fontWeight: 800, color: "#ffffff", marginBottom: "8px" }}>Forgot password</div>
        {submitted ? (
          <p style={{ fontSize: "14px", color: "#a7f3d0", lineHeight: 1.5, margin: "12px 0 0" }}>
            If that email is registered, an admin has been notified. They will set a temporary password for you and let you know — you&apos;ll be asked to change it when you sign in.
          </p>
        ) : (
          <>
            <p style={{ fontSize: "13px", color: "#8a95a8", marginBottom: "20px" }}>
              Enter your email and an admin will set a temporary password for you.
            </p>
            {error ? <div className="login-err" style={{ display: "block", marginBottom: "16px" }}>{error}</div> : null}
            <form onSubmit={handleSubmit}>
              <div className="field">
                <label htmlFor="forgotEmail">Email Address</label>
                <input
                  id="forgotEmail"
                  type="email"
                  placeholder="you@greyorange.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <button className="btn-login" type="submit" disabled={isSubmitting} style={{ opacity: isSubmitting ? 0.7 : 1 }}>
                {isSubmitting ? "Sending..." : "Request password reset"}
              </button>
            </form>
          </>
        )}
        <div style={{ marginTop: "14px", textAlign: "center" }}>
          <Link href="/" style={{ color: "#a78bfa", fontSize: "12px", textDecoration: "underline" }}>
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
