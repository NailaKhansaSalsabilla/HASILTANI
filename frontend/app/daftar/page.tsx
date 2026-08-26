"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { AuthThemeToggle } from "@/components/AuthThemeToggle";
import { register } from "@/lib/session";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "petani" as "petani" | "buyer",
    organization: "",
    location: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const user = await register(form);
      const query = new URLSearchParams({ registered: "1", email: user.email });
      router.push(`/login?${query.toString()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pendaftaran gagal.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page auth-page-account auth-register">
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
          <span className="auth-visual-kicker">BERGABUNG</span>
          <h1>Masuk ke jalur yang tepat.</h1>
          <p>
            Daftar sebagai Petani atau Buyer/Pengolah. Akun baru akan ditinjau Admin
            sebelum dapat digunakan untuk masuk ke dashboard.
          </p>
        </div>
      </section>

      <section className="auth-form-wrap auth-form-wrap-account auth-register-form-wrap">
        <AuthThemeToggle />

        <div className="auth-form auth-form-account auth-register-form">
          <span className="auth-kicker">Daftar</span>
          <h2>Buat aksesmu.</h2>
          <p className="auth-intro">
            Data akun tersimpan di sistem lokal dan akan muncul pada daftar verifikasi Admin.
          </p>

          <form onSubmit={submit} className="auth-fields auth-register-fields">
            <div className="field">
              <label>Peran</label>
              <select
                value={form.role}
                onChange={(event) => setForm({ ...form, role: event.target.value as "petani" | "buyer" })}
              >
                <option value="petani">Petani</option>
                <option value="buyer">Buyer / Pengolah</option>
              </select>
            </div>

            <div className="field">
              <label>Nama lengkap</label>
              <input
                required
                autoComplete="name"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                placeholder="Nama pengguna"
              />
            </div>

            <div className="field">
              <label>Email</label>
              <input
                required
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="nama@email.com"
              />
            </div>

            <div className="field">
              <label>Password</label>
              <input
                required
                minLength={8}
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div className="form-row auth-register-row">
              <div className="field">
                <label>Organisasi / Kelompok</label>
                <input
                  value={form.organization}
                  onChange={(event) => setForm({ ...form, organization: event.target.value })}
                  placeholder="Opsional"
                />
              </div>
              <div className="field">
                <label>Lokasi</label>
                <input
                  value={form.location}
                  onChange={(event) => setForm({ ...form, location: event.target.value })}
                  placeholder="Kabupaten / Kota"
                />
              </div>
            </div>

            {error && <div className="alert alert-error auth-alert">{error}</div>}

            <button className="btn btn-primary btn-block auth-submit" disabled={loading}>
              {loading ? "Menyimpanâ€¦" : <>Daftar & Kirim Verifikasi <ArrowRight size={17} /></>}
            </button>
          </form>

          <div className="auth-links">
            <span>
              Sudah punya akun? <Link href="/login">Masuk</Link>
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}

