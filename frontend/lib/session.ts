"use client";

import {
  getDemoDb,
  getDemoSession,
  loginDemoWithCredentials,
  registerDemoUser,
  setDemoSession,
} from "./demo-db";
import { getSupabase, isSupabaseMode } from "./supabase";
import type { Role, SessionUser } from "./types";

export async function currentSession(): Promise<SessionUser | null> {
  if (!isSupabaseMode()) {
    const stored = getDemoSession();
    if (!stored) return null;

    const fresh = getDemoDb().users.find((row) => row.id === stored.id) ?? null;
    if (!fresh || fresh.verificationStatus === "rejected") {
      setDemoSession(null);
      return null;
    }

    if (JSON.stringify(fresh) !== JSON.stringify(stored)) setDemoSession(fresh);
    return fresh;
  }

  const supabase = getSupabase();
  if (!supabase) return null;
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("id,role,name,organization,verification_status")
    .eq("id", user.id)
    .single();
  if (!profile) return null;

  return {
    id: profile.id,
    name: profile.name,
    email: user.email ?? "",
    role: profile.role as Role,
    organization: profile.organization ?? undefined,
    verificationStatus: profile.verification_status,
  };
}

export async function login(email: string, password: string): Promise<SessionUser> {
  if (!isSupabaseMode()) return loginDemoWithCredentials(email, password);

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;

  const user = await currentSession();
  if (!user) throw new Error("Profil pengguna tidak ditemukan.");
  if (user.verificationStatus === "pending") {
    await supabase.auth.signOut();
    throw new Error("Akun masih menunggu verifikasi Admin HASILTANI.");
  }
  if (user.verificationStatus === "rejected") {
    await supabase.auth.signOut();
    throw new Error("Akun ini belum dapat digunakan karena verifikasinya ditolak.");
  }
  return user;
}


export async function logout() {
  if (!isSupabaseMode()) {
    setDemoSession(null);
    return;
  }
  const supabase = getSupabase();
  await supabase?.auth.signOut();
}

export async function register(input: {
  name: string;
  email: string;
  password: string;
  role: "petani" | "buyer";
  organization?: string;
  location?: string;
}): Promise<SessionUser> {
  if (!isSupabaseMode()) return registerDemoUser(input);

  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const { data, error } = await supabase.auth.signUp({
    email: input.email,
    password: input.password,
    options: {
      data: {
        name: input.name,
        role: input.role,
        organization: input.organization,
        location: input.location,
      },
    },
  });
  if (error) throw error;
  if (!data.user) throw new Error("Pendaftaran gagal membuat pengguna.");

  /* Public registration never enters a dashboard automatically. */
  await supabase.auth.signOut();

  return {
    id: data.user.id,
    name: input.name,
    email: input.email.trim().toLowerCase(),
    role: input.role,
    organization: input.organization || undefined,
    verificationStatus: "pending",
  };
}
