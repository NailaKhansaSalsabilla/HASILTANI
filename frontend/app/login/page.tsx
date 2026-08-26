"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { login } from "@/lib/session";
import type { Role } from "@/lib/types";
import { isSupabaseMode } from "@/lib/supabase";

const DEMO_ACCOUNTS: Record<Role, { email: string; password: string; label: string }> = {
  petani: { email: "petani@hasiltani.local", password: "Petani123!", label: "Petani" },
  buyer: { email: "buyer@hasiltani.local", password: "Buyer123!", label: "Buyer" },
  admin: { email: "admin@hasiltani.local", password: "Admin123!", label: "Admin" },
};

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [selectedDemo, setSelectedDemo] = useState<Role | null>(null);
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const supabaseMode = isSupabaseMode();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const registeredEmail = params.get("email");
    if (params.get("registered") === "1") {
      setRegistered(true);
      if (registeredEmail) setEmail(registeredEmail);
    }
  }, []);

  function destination(role: Role) {
    const next = new URLSearchParams(window.location.search).get("next");
    return next && next.startsWith(`/${role}`) ? next : `/${role}`;
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await login(email, password);
      router.push(destination(user.role));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login gagal.");
    } finally {
      setLoading(false);
    }
  }

  function fillDemo(role: Role) {
    const account = DEMO_ACCOUNTS[role];
    setSelectedDemo(role);
    setEmail(account.email);
    setPassword(account.password);
    setError(null);
    setRegistered(false);
  }

  return (
    <main className="auth-page auth-page-account auth-login">
      <section className="auth-visual auth-visual-account" aria-label="Identitas HASILTANI">
        <div className="auth-visual-grid" aria-hidden="true" />
        <div className="auth-logo-scene" aria-hidden="true">
          <span className="auth-logo-ring one" />
          <span className="auth-logo-ring two" />
          <Image className="auth-logo-mascot"
            src="/brand/identity-mascot.png"
            alt=""
            width={420}
            height={420}
            priority
          />
          <Image
            className="auth-logo-wordmark"
            src="/brand/identity-wordmark.png"
            alt="HASILTANI — Platform Hasil Pertanian"
            width={420}
            height={160}
            priority
          />
        </div>

        <Link href="/" className="auth-back">
          <ArrowLeft size={16} />
          Beranda
        </Link>

        <div className="auth-visual-content auth-visual-content-account">
          <span className="auth-visual-kicker">HASILTANI</span>
          <h1>Masuk sesuai peranmu.</h1>
          <p>
            Petani mengelola hasil. Buyer mengelola kebutuhan. Admin menjaga alur dan
            kepercayaan ekosistem.
          </p>
        </div>
      </section>

      <section className="auth-form-wrap auth-form-wrap-account">
        <AuthThemeToggle />

        <div className="auth-form auth-form-account">
          <span className="auth-kicker">Masuk ke HASILTANI</span>
          <h2>Lanjutkan peranmu.</h2>
          <p className="auth-intro">
            Gunakan akunmu sendiri atau isi akun demo lokal, lalu tekan tombol Masuk.
          </p>

          {registered && (
            <div className="alert alert-success auth-alert">
              <CheckCircle2 size={16} />
              <span>
                Pendaftaran tersimpan. Akunmu sekarang masuk daftar verifikasi Admin.
                Setelah diverifikasi, masuk menggunakan email dan password yang baru dibuat.
              </span>
            </div>
          )}

          {!supabaseMode && (
            <div className="auth-demo">
              <div className="auth-demo-label">
                <ShieldCheck size={15} />
                Akun demo lokal
              </div>
              <div className="demo-role-grid demo-role-grid-account">
                {(Object.keys(DEMO_ACCOUNTS) as Role[]).map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={`demo-role-btn demo-role-btn-account ${selectedDemo === role ? "active" : ""}`}
                    onClick={() => fillDemo(role)}
                  >
                    {DEMO_ACCOUNTS[role].label}
                  </button>
                ))}
              </div>
              <small>Klik peran hanya mengisi kredensial. Tetap tekan Masuk untuk login.</small>
            </div>
          )}

          <form onSubmit={submit} className="auth-fields">
            <div className="field">
              <label>Email</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setSelectedDemo(null);
                }}
                placeholder="nama@email.com"
                required
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setSelectedDemo(null);
                }}
                placeholder="Masukkan password"
                required
              />
            </div>

            {error && <div className="alert alert-error auth-alert">{error}</div>}

            <button className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? "Memprosesâ€¦" : <>Masuk <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-links">
            <span>
              Belum punya akun? <Link href="/daftar">Daftar sebagai Petani atau Buyer</Link>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

