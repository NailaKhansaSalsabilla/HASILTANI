"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutDashboard, Menu, Moon, ScanLine, Sun, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { currentSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

const ROLE_LABEL: Record<string, string> = {
  petani: "Petani",
  buyer: "Buyer / Pengolah",
  admin: "Admin",
};

type HomeSection = "beranda" | "komoditas" | "cara-kerja" | "jalur" | "tentang" | "";
type ThemeMode = "light" | "dark";

const HOME_SECTIONS: Array<Exclude<HomeSection, "beranda" | "">> = [
  "komoditas",
  "cara-kerja",
  "jalur",
  "tentang",
];

function getInitialTheme(): ThemeMode {
  if (typeof window === "undefined") return "light";

  const saved = window.localStorage.getItem("hasiltani-theme");
  if (saved === "dark" || saved === "light") return saved;

  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState<HomeSection>("beranda");
  const [theme, setTheme] = useState<ThemeMode>("light");

  useEffect(() => {
    currentSession().then(setUser);

    const sessionListener = () => currentSession().then(setUser);
    window.addEventListener("hasiltani:session", sessionListener);

    return () => {
      window.removeEventListener("hasiltani:session", sessionListener);
    };
  }, []);

  useEffect(() => {
    const initialTheme = getInitialTheme();
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    document.documentElement.style.colorScheme = initialTheme;
  }, []);

  useEffect(() => {
    const updateNavigationState = () => {
      setScrolled(window.scrollY > 24);

      if (pathname !== "/") {
        setActiveSection("");
        return;
      }

      const marker = Math.min(190, Math.max(120, window.innerHeight * 0.22));
      let current: HomeSection = "beranda";

      for (const id of HOME_SECTIONS) {
        const section = document.getElementById(id);
        if (!section) continue;

        const rect = section.getBoundingClientRect();

        if (rect.top <= marker && rect.bottom > marker) {
          current = id;
          break;
        }

        if (rect.top <= marker) current = id;
      }

      setActiveSection(current);
    };

    updateNavigationState();

    window.addEventListener("scroll", updateNavigationState, { passive: true });
    window.addEventListener("resize", updateNavigationState);
    window.addEventListener("hashchange", updateNavigationState);

    const timer = window.setTimeout(updateNavigationState, 120);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", updateNavigationState);
      window.removeEventListener("resize", updateNavigationState);
      window.removeEventListener("hashchange", updateNavigationState);
    };
  }, [pathname]);

  const dashboard = user ? `/${user.role}` : "/login";
  const roleLabel = user ? (ROLE_LABEL[user.role] ?? user.role) : null;

  const sectionClass = (section: HomeSection) => {
    const commodityDetailActive =
      section === "komoditas" && pathname.startsWith("/komoditas/");

    return activeSection === section || commodityDetailActive
      ? "nav-section-link active"
      : "nav-section-link";
  };

  const toggleTheme = () => {
    const next: ThemeMode = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    window.localStorage.setItem("hasiltani-theme", next);
  };

  return (
    <header
      className={`site-header site-header-foundation site-header-brand ${open ? "open" : ""} ${
        scrolled ? "scrolled" : ""
      }`}
    >
      <div className="site-header-inner site-header-inner-foundation site-header-inner-brand">
        <Link href="/" className="brand-lockup" aria-label="HASILTANI beranda">
          <span className="brand-mark">
            <Image src="/brand/identity-mascot.png" alt="" width={54} height={54} priority />
          </span>

          <span className="brand-wordmark">
            <Image
              src="/brand/identity-wordmark.png"
              alt="HASILTANI"
              width={220}
              height={72}
              priority
            />
          </span>
        </Link>

        <nav className="site-nav site-nav-foundation site-nav-brand" aria-label="Navigasi utama">
          <Link
            href="/"
            className={sectionClass("beranda")}
            aria-current={activeSection === "beranda" ? "page" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="nav-label">Beranda</span>
          </Link>

          <Link
            href="/#komoditas"
            className={sectionClass("komoditas")}
            aria-current={
              activeSection === "komoditas" || pathname.startsWith("/komoditas/")
                ? "location"
                : undefined
            }
            onClick={() => setOpen(false)}
          >
            <span className="nav-label">Komoditas</span>
          </Link>

          <Link
            href="/#cara-kerja"
            className={sectionClass("cara-kerja")}
            aria-current={activeSection === "cara-kerja" ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="nav-label">Cara Kerja</span>
          </Link>

          <Link
            href="/#jalur"
            className={sectionClass("jalur")}
            aria-current={activeSection === "jalur" ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="nav-label">Jalur Hasil</span>
          </Link>

          <Link
            href="/#tentang"
            className={sectionClass("tentang")}
            aria-current={activeSection === "tentang" ? "location" : undefined}
            onClick={() => setOpen(false)}
          >
            <span className="nav-label">Tentang</span>
          </Link>

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Aktifkan mode terang" : "Aktifkan mode gelap"}
            title={theme === "dark" ? "Mode terang" : "Mode gelap"}
          >
            {theme === "dark" ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          {user ? (
            <>
              <span className={`role-chip role-${user.role}`}>
                <span className="role-chip-dot" />
                {roleLabel}
              </span>

              <Link
                href={dashboard}
                className={`dashboard-link ${
                  pathname === dashboard ? "dashboard-active" : ""
                }`}
                aria-current={pathname === dashboard ? "page" : undefined}
                onClick={() => setOpen(false)}
              >
                <LayoutDashboard size={15} />
                Dashboard
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              className={pathname === "/login" ? "dashboard-active" : undefined}
              aria-current={pathname === "/login" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Masuk
            </Link>
          )}

          {(!user || user.role === "petani") && (
            <Link
              className="header-scan-foundation header-scan-brand header-scan-navigation"
              href="/scan"
              onClick={() => setOpen(false)}
            >
              <ScanLine size={16} />
              <span>Coba Scan</span>
            </Link>
          )}
        </nav>

        <button
          className="mobile-menu-btn mobile-menu-btn-foundation"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Tutup menu" : "Buka menu"}
          aria-expanded={open}
        >
          {open ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>
    </header>
  );
}
