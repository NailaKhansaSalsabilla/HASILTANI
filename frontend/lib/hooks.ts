"use client";

import { useEffect, useState } from "react";
import { loadAppDb } from "./demo-db";
import { currentSession } from "./session";
import type { DemoDb, SessionUser } from "./types";

export function useDemoDb() {
  const [db, setDb] = useState<DemoDb | null>(null);
  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const next = await loadAppDb();
        if (alive) setDb(next);
      } catch (error) {
        console.error("HASILTANI data refresh failed", error);
      }
    };
    const storageRefresh = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("hasiltani:")) void refresh();
    };
    refresh();
    window.addEventListener("hasiltani:db", refresh);
    window.addEventListener("storage", storageRefresh);
    return () => {
      alive = false;
      window.removeEventListener("hasiltani:db", refresh);
      window.removeEventListener("storage", storageRefresh);
    };
  }, []);
  return db;
}

export function useSessionUser() {
  const [user, setUser] = useState<SessionUser | null | undefined>(undefined);
  useEffect(() => {
    const refresh = () => currentSession().then(setUser).catch(() => setUser(null));
    const storageRefresh = (event: StorageEvent) => {
      if (!event.key || event.key.startsWith("hasiltani:")) refresh();
    };
    refresh();
    window.addEventListener("hasiltani:session", refresh);
    window.addEventListener("storage", storageRefresh);
    return () => {
      window.removeEventListener("hasiltani:session", refresh);
      window.removeEventListener("storage", storageRefresh);
    };
  }, []);
  return user;
}
