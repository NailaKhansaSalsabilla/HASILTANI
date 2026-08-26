"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BarChart3,
  CircleGauge,
  ClipboardCheck,
  FileSearch,
  GitMerge,
  HandCoins,
  Home,
  LogOut,
  Menu,
  MoreHorizontal,
  PackagePlus,
  Route,
  ScanLine,
  Settings2,
  ShoppingBasket,
  X,
} from "lucide-react";
import {
  useEffect,
  useMemo,
  useState,
  type ComponentType,
  type ReactNode,
} from "react";
import { Brand } from "./Brand";
import { logout } from "@/lib/session";
import { useSessionUser } from "@/lib/hooks";
import type { Role } from "@/lib/types";

type NavItem = [string, string, ComponentType<{ size?: number }>];

const nav = {
  petani: [
    ["/petani", "Ringkasan", CircleGauge],
    ["/petani/batch/baru", "Buat Batch", PackagePlus],
    ["/petani/match", "Buyer Match", ShoppingBasket],
    ["/petani/pool", "Harvest Pool", GitMerge],
    ["/petani/offer", "Offer", HandCoins],
    ["/petani/impact", "Impact", BarChart3],
  ],
  buyer: [
    ["/buyer", "Ringkasan", CircleGauge],
    ["/buyer/demand/baru", "Buat Demand", PackagePlus],
    ["/buyer/matches", "Matches", FileSearch],
    ["/buyer/offers", "Offers", HandCoins],
  ],
  admin: [
    ["/admin", "Overview", CircleGauge],
    ["/admin/verifikasi", "Verifikasi", ClipboardCheck],
    ["/admin/rules", "Routing Rules", Route],
    ["/admin/moderasi", "Moderasi", Settings2],
    ["/admin/impact", "Impact", BarChart3],
  ],
} satisfies Record<Role, NavItem[]>;

const roleName: Record<Role, string> = {
  petani: "Petani",
  buyer: "Buyer / Pengolah",
  admin: "Admin",
};

const compactLabel: Record<string, string> = {
  Ringkasan: "Ringkas",
  "Buat Batch": "Batch",
  "Buyer Match": "Match",
  "Harvest Pool": "Pool",
  Offer: "Offer",
  Impact: "Impact",
  "Buat Demand": "Demand",
  Matches: "Match",
  Offers: "Offer",
  Overview: "Overview",
  Verifikasi: "Verifikasi",
  "Routing Rules": "Rules",
  Moderasi: "Moderasi",
};

export function RoleShell({
  role,
  children,
}: {
  role: Role;
  children: ReactNode;
}) {
  const user = useSessionUser();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user === null) router.replace("/login");
    else if (user && user.role !== role) router.replace(`/${user.role}`);
  }, [user, role, router]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };

    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const items = nav[role];

  const title = useMemo(() => {
    const exact = items.find(([href]) => pathname === href);
    if (exact) return exact[1];

    const nested = [...items]
      .sort((a, b) => b[0].length - a[0].length)
      .find(([href]) => href !== `/${role}` && pathname.startsWith(`${href}/`));

    return nested?.[1] ?? roleName[role];
  }, [items, pathname, role]);

  const mobilePrimaryItems = items.slice(0, 4);

  if (user === undefined) {
    return (
      <div className="analysis-loading">
        <div>
          <div className="pulse-orb">
            <div className="pulse-core">
              <ScanLine />
            </div>
          </div>
          <p>Menyiapkan dashboardâ€¦</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== role) return null;

  async function signOut() {
    await logout();
    router.push("/");
  }

  function goBack() {
    if (pathname === `/${role}`) {
      router.push("/");
      return;
    }

    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(`/${role}`);
    }
  }

  return (
    <div className="dashboard-body">
      <div className="role-layout">
        <aside className="sidebar">
          <Brand />

          <div className="sidebar-profile">
            <small>{roleName[role]}</small>
            <strong>{user.name}</strong>
            <small>{user.organization}</small>
          </div>

          <nav className="side-nav">
            {items.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={`side-link ${pathname === href ? "active" : ""}`}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="sidebar-bottom">
            <Link href="/" className="side-link">
              <Home size={19} />
              <span>Beranda</span>
            </Link>

            <button className="btn btn-ghost btn-small" onClick={signOut}>
              <LogOut size={17} />
              <span>Keluar</span>
            </button>
          </div>
        </aside>

        <div className="role-content">
          <header className="dashboard-topbar dashboard-topbar-mobile">
            <div className="dashboard-title-group">
              <button
                type="button"
                className="dashboard-mobile-back"
                onClick={goBack}
                aria-label={
                  pathname === `/${role}` ? "Kembali ke beranda" : "Kembali"
                }
              >
                {pathname === `/${role}` ? (
                  <Home size={19} />
                ) : (
                  <ArrowLeft size={20} />
                )}
              </button>

              <span className="dashboard-mobile-brand" aria-hidden="true">
                <Brand compact />
              </span>

              <div className="dashboard-title-copy">
                <small className="dashboard-role-mobile">
                  {roleName[role]}
                </small>
                <h1>{title}</h1>
              </div>
            </div>

            <div className="topbar-actions topbar-actions-mobile">
              <span className={`status ${user.verificationStatus}`}>
                {user.verificationStatus}
              </span>

              {role === "petani" && (
                <Link
                  href="/scan"
                  className="btn btn-primary btn-small dashboard-scan-desktop"
                >
                  <ScanLine size={16} />
                  <span>Analisis Hasil</span>
                </Link>
              )}

              <button
                type="button"
                className="dashboard-mobile-menu"
                onClick={() => setMobileMenuOpen(true)}
                aria-label="Buka menu dashboard"
                aria-expanded={mobileMenuOpen}
              >
                <Menu size={21} />
              </button>
            </div>
          </header>

          <main className="dashboard-main dashboard-main-mobile">{children}</main>
        </div>

        <nav className="mobile-topnav mobile-topnav-mobile" aria-label="Navigasi cepat">
          {mobilePrimaryItems.map(([href, label, Icon]) => (
            <Link
              key={href}
              href={href}
              className={pathname === href ? "active" : ""}
              aria-label={label}
            >
              <Icon size={19} />
              <span>{compactLabel[label] ?? label}</span>
            </Link>
          ))}

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={mobileMenuOpen ? "active" : ""}
            aria-label="Menu lainnya"
          >
            <MoreHorizontal size={20} />
            <span>Menu</span>
          </button>
        </nav>

        <div
          className={`dashboard-mobile-overlay ${
            mobileMenuOpen ? "open" : ""
          }`}
          aria-hidden={!mobileMenuOpen}
          onClick={() => setMobileMenuOpen(false)}
        />

        <aside
          className={`dashboard-mobile-sheet ${
            mobileMenuOpen ? "open" : ""
          }`}
          aria-hidden={!mobileMenuOpen}
        >
          <div className="dashboard-mobile-sheet-head">
            <div>
              <div className="dashboard-mobile-sheet-brand">
                <Brand />
              </div>
              <small>{roleName[role]}</small>
              <strong>{user.name}</strong>
              {user.organization && <span>{user.organization}</span>}
            </div>

            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              aria-label="Tutup menu dashboard"
            >
              <X size={21} />
            </button>
          </div>

          <nav className="dashboard-mobile-sheet-nav">
            {items.map(([href, label, Icon]) => (
              <Link
                key={href}
                href={href}
                className={pathname === href ? "active" : ""}
              >
                <Icon size={19} />
                <span>{label}</span>
              </Link>
            ))}
          </nav>

          <div className="dashboard-mobile-sheet-actions">
            {role === "petani" && (
              <Link href="/scan" className="dashboard-mobile-primary">
                <ScanLine size={18} />
                <span>Analisis Hasil</span>
              </Link>
            )}

            <Link href="/" className="dashboard-mobile-secondary">
              <Home size={18} />
              <span>Beranda HASILTANI</span>
            </Link>

            <button
              type="button"
              onClick={signOut}
              className="dashboard-mobile-secondary"
            >
              <LogOut size={18} />
              <span>Keluar</span>
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}


