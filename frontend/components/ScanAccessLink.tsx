"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { currentSession } from "@/lib/session";
import type { SessionUser } from "@/lib/types";

type ScanAccessLinkProps = {
  href?: string;
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  "aria-label"?: string;
};

export function ScanAccessLink({
  href = "/scan",
  className,
  children,
  onClick,
  "aria-label": ariaLabel,
}: ScanAccessLinkProps) {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const session = await currentSession();
      if (active) setUser(session);
    };

    void refresh();

    const handleSession = () => void refresh();
    window.addEventListener("hasiltani:session", handleSession);

    return () => {
      active = false;
      window.removeEventListener("hasiltani:session", handleSession);
    };
  }, []);

  if (user === undefined) return null;
  if (user && (user.role === "buyer" || user.role === "admin")) return null;

  return (
    <Link href={href} className={className} onClick={onClick} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
