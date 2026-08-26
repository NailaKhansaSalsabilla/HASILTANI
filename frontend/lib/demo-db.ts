"use client";

import type { Batch, DemoDb, Demand, Offer, Pool, Role, RoutingRule, SessionUser } from "./types";
import { getSupabase, isSupabaseMode } from "./supabase";
import { commodityCover, resolveBatchCover } from "./commodity-images";

const DB_KEY = "hasiltani:demo-db:v3";
const SESSION_KEY = "hasiltani:session:v1";
const AUTH_KEY = "hasiltani:demo-auth:v1";

const now = new Date();
const iso = (offsetDays = 0) => new Date(now.getTime() + offsetDays * 86400000).toISOString();

const seedUsers: SessionUser[] = [
  {
    id: "farmer-1",
    name: "Sari Wulandari",
    email: "petani@hasiltani.local",
    role: "petani",
    organization: "Kelompok Tani Sejahtera",
    verificationStatus: "verified",
  },
  {
    id: "buyer-1",
    name: "Dimas Pratama",
    email: "buyer@hasiltani.local",
    role: "buyer",
    organization: "Dapur Nusantara",
    verificationStatus: "verified",
  },
  {
    id: "admin-1",
    name: "Admin HASILTANI",
    email: "admin@hasiltani.local",
    role: "admin",
    organization: "HASILTANI Operations",
    verificationStatus: "verified",
  },
  {
    id: "buyer-2",
    name: "Rina Amalia",
    email: "rina@segarmart.demo",
    role: "buyer",
    organization: "SegarMart",
    verificationStatus: "pending",
  },
];

const seedBatches: Batch[] = [
  {
    id: "batch-tomat-24",
    farmerId: "farmer-1",
    commodity: "tomat",
    weightKg: 24,
    location: "Natar, Lampung Selatan",
    harvestDate: iso(-1).slice(0, 10),
    status: "matched",
    condition: "ripe",
    conditionLabel: "Matang",
    confidence: 0.91,
    routingStatus: "READY",
    modelVersion: "SEED-DEMO",
    analysisMode: "demo",
    coverImage: "/commodities/tomat.jpg",
    createdAt: iso(-1),
  },
  {
    id: "batch-tomat-18",
    farmerId: "farmer-1",
    commodity: "tomat",
    weightKg: 18,
    location: "Natar, Lampung Selatan",
    harvestDate: iso(-1).slice(0, 10),
    status: "pooled",
    condition: "ripe",
    conditionLabel: "Matang",
    confidence: 0.89,
    routingStatus: "READY",
    modelVersion: "SEED-DEMO",
    analysisMode: "demo",
    coverImage: "/commodities/tomat.jpg",
    createdAt: iso(-2),
  },

  {
    id: "batch-tomat-15",
    farmerId: "farmer-1",
    commodity: "tomat",
    weightKg: 15,
    location: "Natar, Lampung Selatan",
    harvestDate: iso(-1).slice(0, 10),
    status: "pooled",
    condition: "ripe",
    conditionLabel: "Matang",
    confidence: 0.87,
    routingStatus: "READY",
    modelVersion: "SEED-DEMO",
    analysisMode: "demo",
    coverImage: "/commodities/tomat.jpg",
    createdAt: iso(-1.3),
  },
  {
    id: "batch-pisang-32",
    farmerId: "farmer-1",
    commodity: "pisang",
    weightKg: 32,
    location: "Gedong Tataan, Pesawaran",
    harvestDate: iso(-2).slice(0, 10),
    status: "analyzed",
    condition: "ripe",
    conditionLabel: "Matang",
    confidence: 0.94,
    routingStatus: "READY",
    modelVersion: "SEED-DEMO",
    analysisMode: "demo",
    coverImage: "/commodities/pisang.jpg",
    createdAt: iso(-2),
  },
];

const seedDemands: Demand[] = [
  {
    id: "demand-tomat-30",
    buyerId: "buyer-1",
    buyerName: "Dapur Nusantara",
    commodity: "tomat",
    acceptedConditions: ["ripe", "overripe"],
    minimumVolumeKg: 30,
    offerPricePerKg: 9500,
    location: "Bandar Lampung",
    radiusKm: 35,
    deadline: iso(3).slice(0, 10),
    status: "active",
    createdAt: iso(-2),
  },
  {
    id: "demand-tomat-50",
    buyerId: "buyer-1",
    buyerName: "Sambal Makmur",
    commodity: "tomat",
    acceptedConditions: ["ripe", "overripe"],
    minimumVolumeKg: 50,
    offerPricePerKg: 6000,
    location: "Metro, Lampung",
    radiusKm: 55,
    deadline: iso(5).slice(0, 10),
    status: "active",
    createdAt: iso(-1),
  },
  {
    id: "demand-pisang-40",
    buyerId: "buyer-1",
    buyerName: "Dapur Nusantara",
    commodity: "pisang",
    acceptedConditions: ["ripe", "overripe"],
    minimumVolumeKg: 40,
    offerPricePerKg: 11200,
    location: "Bandar Lampung",
    radiusKm: 45,
    deadline: iso(4).slice(0, 10),
    status: "active",
    createdAt: iso(-1),
  },
  {
    id: "demand-mangga-80",
    buyerId: "buyer-2",
    buyerName: "SegarMart",
    commodity: "mangga",
    acceptedConditions: ["ripe"],
    minimumVolumeKg: 80,
    offerPricePerKg: 24000,
    location: "Bandar Lampung",
    radiusKm: 40,
    deadline: iso(6).slice(0, 10),
    status: "active",
    createdAt: iso(-1),
  },
  {
    id: "demand-jeruk-60",
    buyerId: "buyer-1",
    buyerName: "Dapur Nusantara",
    commodity: "jeruk",
    acceptedConditions: ["ripe"],
    minimumVolumeKg: 60,
    offerPricePerKg: 14000,
    location: "Bandar Lampung",
    radiusKm: 45,
    deadline: iso(5).slice(0, 10),
    status: "active",
    createdAt: iso(-1),
  },
];

const seedPools: Pool[] = [
  {
    id: "pool-tomat-57",
    targetDemandId: "demand-tomat-50",
    memberBatchIds: ["batch-tomat-24", "batch-tomat-18", "batch-tomat-15"],
    totalWeightKg: 57,
    targetWeightKg: 50,
    status: "ready",
    commodity: "tomat",
    createdAt: iso(-1),
  },
];

const seedOffers: Offer[] = [
  {
    id: "offer-1",
    demandId: "demand-tomat-30",
    batchId: "batch-tomat-24",
    sellerId: "farmer-1",
    buyerId: "buyer-1",
    buyerName: "Dapur Nusantara",
    offeredPricePerKg: 9500,
    acceptedWeightKg: 24,
    status: "pending",
    createdAt: iso(-0.4),
  },
];

const seedRules: RoutingRule[] = [
  { id: "r1", commodity: "pisang", condition: "unripe", destination: "Keripik Pisang", score: 96, reason: "Pisang belum matang dapat menjadi kandidat bahan baku keripik bagi pengolah yang menerima kondisi ini.", active: true },
  { id: "r2", commodity: "pisang", condition: "rotten", destination: "Kompos / Bahan Organik", score: 100, reason: "Jalur pangan ditahan untuk indikasi busuk/kerusakan berat.", active: true },
  { id: "r3", commodity: "tomat", condition: "overripe", destination: "Saus / Sambal / Puree", score: 93, reason: "Tomat lewat puncak tetapi tidak rusak berat dapat menjadi kandidat pengolahan.", active: true },
  { id: "r4", commodity: "tomat", condition: "rotten", destination: "Kompos / Bahan Organik", score: 100, reason: "Kerusakan visual berat diarahkan ke kandidat non-pangan.", active: true },
  { id: "r5", commodity: "mangga", condition: "unripe", destination: "Asinan / Pickle / Olahan", score: 94, reason: "Mangga belum matang dapat cocok untuk buyer pengolah tertentu.", active: true },
  { id: "r6", commodity: "mangga", condition: "overripe", destination: "Juice / Puree", score: 95, reason: "Memerlukan konfirmasi visual bahwa buah tidak rusak/busuk berat.", active: true },
  { id: "r7", commodity: "jeruk", condition: "ripe", destination: "Fresh Market", score: 97, reason: "Jeruk matang cocok untuk permintaan fresh.", active: true },
  { id: "r8", commodity: "jeruk", condition: "overripe", destination: "Juice / Processing", score: 93, reason: "Memerlukan konfirmasi visual bahwa buah tidak rusak/busuk berat.", active: true },
];


function migrateBatchCovers(db: DemoDb) {
  let changed = false;

  const batches = db.batches.map((batch) => {
    const nextCover = resolveBatchCover(batch.commodity, batch.coverImage);

    if (nextCover === batch.coverImage) return batch;

    changed = true;
    return { ...batch, coverImage: nextCover };
  });

  if (!changed) return db;

  const migrated = { ...db, batches };

  if (typeof window !== "undefined") {
    window.localStorage.setItem(DB_KEY, JSON.stringify(migrated));
  }

  return migrated;
}

function migrateCanonicalConditions(db: DemoDb) {
  let changed = false;

  const canonical = (value?: string) => {
    if (value === "old") return "overripe";
    if (value === "damaged" || value === "manual_damaged") return "rotten";
    return value;
  };

  const batches = db.batches.map((batch) => {
    const next = canonical(batch.condition);
    if (next === batch.condition) return batch;
    changed = true;
    return {
      ...batch,
      condition: next,
      conditionLabel: next === "overripe" ? "Terlalu Matang" : next === "rotten" ? "Rusak / Busuk Berat" : batch.conditionLabel,
    };
  });

  const demands = db.demands.map((demand) => {
    const acceptedConditions = demand.acceptedConditions.map((item) => canonical(item) ?? item);
    if (acceptedConditions.join("|") === demand.acceptedConditions.join("|")) return demand;
    changed = true;
    return { ...demand, acceptedConditions };
  });

  const rules = db.rules.map((rule) => {
    const condition = canonical(rule.condition) ?? rule.condition;
    if (condition === rule.condition) return rule;
    changed = true;
    return { ...rule, condition };
  });

  if (!changed) return db;
  const migrated = { ...db, batches, demands, rules };
  if (typeof window !== "undefined") {
    window.localStorage.setItem(DB_KEY, JSON.stringify(migrated));
  }
  return migrated;
}

function initialDb(): DemoDb {
  return {
    users: seedUsers,
    batches: seedBatches,
    demands: seedDemands,
    pools: seedPools,
    offers: seedOffers,
    rules: seedRules,
    moderation: [
      { id: "flag-1", targetType: "buyer-demand", reason: "Buyer baru perlu verifikasi identitas usaha sebelum demand diprioritaskan.", status: "open", createdAt: iso(-0.7) },
      { id: "flag-2", targetType: "batch-photo", reason: "Foto batch terlalu gelap; sistem meminta retake sebelum routing otomatis.", status: "open", createdAt: iso(-0.3) },
    ],
    impact: { analyzedKg: 2840, matchedKg: 1920, pooledKg: 870, routedKg: 1614 },
  };
}

export function getDemoDb(): DemoDb {
  if (typeof window === "undefined") return initialDb();
  const raw = window.localStorage.getItem(DB_KEY);
  if (!raw) {
    const db = initialDb();
    saveDemoDb(db);
    return db;
  }
  try {
    return migrateCanonicalConditions(migrateBatchCovers(JSON.parse(raw) as DemoDb));
  } catch {
    const db = initialDb();
    saveDemoDb(db);
    return db;
  }
}

export function saveDemoDb(db: DemoDb) {
  window.localStorage.setItem(DB_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event("hasiltani:db"));
}


export async function loadAppDb(): Promise<DemoDb> {
  if (!isSupabaseMode()) return getDemoDb();
  const supabase = getSupabase();
  if (!supabase) return getDemoDb();

  const [profilesRes, batchesRes, demandsRes, poolsRes, membersRes, offersRes, rulesRes, impactRes, moderationRes] = await Promise.all([
    supabase.from("profiles").select("id,role,name,organization,verification_status"),
    supabase.from("batches").select("id,farmer_id,commodity,weight_kg,location,harvest_date,status,cover_image_url,created_at,grading_results(condition_raw,condition_label,confidence,routing_status,model_version,mode),use_recommendations(destination_type,score,rule_version,reason)"),
    supabase.from("buyer_demands").select("id,buyer_id,commodity,accepted_conditions,minimum_volume_kg,offer_price_per_kg,location,radius_km,deadline,status,created_at"),
    supabase.from("harvest_pools").select("id,target_demand_id,total_weight_kg,status,created_at,buyer_demands(commodity,minimum_volume_kg)"),
    supabase.from("pool_members").select("pool_id,batch_id,accepted_weight_kg"),
    supabase.from("offers").select("id,demand_id,batch_id,pool_id,seller_id,buyer_id,offered_price_per_kg,accepted_weight_kg,status,created_at"),
    supabase.from("routing_rules").select("id,commodity,condition_raw,destination_type,base_score,reason,is_active"),
    supabase.from("impact_records").select("event_type,weight_kg"),
    supabase.from("moderation_flags").select("id,target_type,reason,status,created_at"),
  ]);

  const firstError = [profilesRes,batchesRes,demandsRes,poolsRes,membersRes,offersRes,rulesRes,impactRes,moderationRes].find((r) => r.error)?.error;
  if (firstError) throw firstError;

  const profiles = (profilesRes.data ?? []) as any[];
  const nameById = new Map(profiles.map((p) => [p.id, p.organization || p.name]));
  const users: SessionUser[] = profiles.map((p) => ({
    id: p.id,
    name: p.name,
    email: "",
    role: p.role,
    organization: p.organization ?? undefined,
    verificationStatus: p.verification_status,
  }));

  const batches: Batch[] = await Promise.all(((batchesRes.data ?? []) as any[]).map(async (b) => {
    const grading = Array.isArray(b.grading_results) ? b.grading_results[0] : b.grading_results;
    let coverImage: string | undefined = undefined;
    if (b.cover_image_url) {
      if (String(b.cover_image_url).startsWith("http") || String(b.cover_image_url).startsWith("/")) coverImage = b.cover_image_url;
      else {
        const { data: signed } = await supabase.storage.from("batch-photos").createSignedUrl(b.cover_image_url, 3600);
        coverImage = signed?.signedUrl ?? undefined;
      }
    }
    return {
      id: b.id,
      farmerId: b.farmer_id,
      commodity: b.commodity,
      weightKg: Number(b.weight_kg),
      location: b.location,
      harvestDate: b.harvest_date,
      status: b.status,
      condition: grading?.condition_raw ?? undefined,
      conditionLabel: grading?.condition_label ?? undefined,
      confidence: grading?.confidence == null ? undefined : Number(grading.confidence),
      routingStatus: grading?.routing_status ?? undefined,
      coverImage,
      modelVersion: grading?.model_version ?? undefined,
      analysisMode: grading?.mode ?? undefined,
      routes: ((b.use_recommendations ?? []) as any[]).map((r:any) => ({ name:r.destination_type, score:Number(r.score), rule_version:r.rule_version, reason:r.reason })),
      createdAt: b.created_at,
    };
  }));

  const demands: Demand[] = ((demandsRes.data ?? []) as any[]).map((d) => ({
    id: d.id,
    buyerId: d.buyer_id,
    buyerName: nameById.get(d.buyer_id) || "Buyer HASILTANI",
    commodity: d.commodity,
    acceptedConditions: d.accepted_conditions ?? [],
    minimumVolumeKg: Number(d.minimum_volume_kg),
    offerPricePerKg: Number(d.offer_price_per_kg),
    location: d.location,
    radiusKm: Number(d.radius_km),
    deadline: d.deadline,
    status: d.status,
    createdAt: d.created_at,
  }));

  const memberMap = new Map<string,string[]>();
  for (const row of (membersRes.data ?? []) as any[]) {
    const arr = memberMap.get(row.pool_id) ?? [];
    arr.push(row.batch_id); memberMap.set(row.pool_id, arr);
  }
  const pools: Pool[] = ((poolsRes.data ?? []) as any[]).map((p) => ({
    id: p.id,
    targetDemandId: p.target_demand_id,
    memberBatchIds: memberMap.get(p.id) ?? [],
    totalWeightKg: Number(p.total_weight_kg),
    targetWeightKg: Number(p.buyer_demands?.minimum_volume_kg ?? p.total_weight_kg),
    status: p.status,
    commodity: p.buyer_demands?.commodity ?? "tomat",
    createdAt: p.created_at,
  }));

  const offers: Offer[] = ((offersRes.data ?? []) as any[]).map((o) => ({
    id: o.id,
    demandId: o.demand_id,
    batchId: o.batch_id ?? undefined,
    poolId: o.pool_id ?? undefined,
    sellerId: o.seller_id,
    buyerId: o.buyer_id,
    buyerName: nameById.get(o.buyer_id) || "Buyer HASILTANI",
    offeredPricePerKg: Number(o.offered_price_per_kg),
    acceptedWeightKg: Number(o.accepted_weight_kg),
    status: o.status,
    createdAt: o.created_at,
  }));

  const rules: RoutingRule[] = ((rulesRes.data ?? []) as any[]).map((r) => ({
    id: r.id,
    commodity: r.commodity,
    condition: r.condition_raw,
    destination: r.destination_type,
    score: Number(r.base_score),
    reason: r.reason,
    active: Boolean(r.is_active),
  }));

  const impact = { analyzedKg:0, matchedKg:0, pooledKg:0, routedKg:0 };
  for (const row of (impactRes.data ?? []) as any[]) {
    const w = Number(row.weight_kg || 0);
    if (row.event_type === "analyzed") impact.analyzedKg += w;
    if (row.event_type === "matched") impact.matchedKg += w;
    if (row.event_type === "pooled") impact.pooledKg += w;
    if (row.event_type === "routed" || row.event_type === "offer_accepted") impact.routedKg += w;
  }

  const moderation = ((moderationRes.data ?? []) as any[]).map((f) => ({
    id:f.id, targetType:f.target_type, reason:f.reason, status:(f.status === "resolved" ? "resolved" : "open") as "open" | "resolved", createdAt:f.created_at,
  }));
  return { users, batches, demands, pools, offers, rules, moderation, impact };
}

function emitDbRefresh() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("hasiltani:db"));
}

export function resetDemoDb() {
  const db = initialDb();
  if (typeof window !== "undefined") window.localStorage.removeItem(AUTH_KEY);
  saveDemoDb(db);
  return db;
}

export function getDemoSession(): SessionUser | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as SessionUser; } catch { return null; }
}

export function setDemoSession(user: SessionUser | null) {
  if (!user) window.localStorage.removeItem(SESSION_KEY);
  else window.localStorage.setItem(SESSION_KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("hasiltani:session"));
}

type DemoCredential = {
  userId: string;
  email: string;
  passwordHash: string;
};

const seedPasswords: Record<"farmer-1" | "buyer-1" | "admin-1", string> = {
  "farmer-1": "Petani123!",
  "buyer-1": "Buyer123!",
  "admin-1": "Admin123!",
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string) {
  const value = password.normalize("NFKC");
  if (typeof crypto !== "undefined" && crypto.subtle) {
    const bytes = new TextEncoder().encode(value);
    const digest = await crypto.subtle.digest("SHA-256", bytes);
    return Array.from(new Uint8Array(digest))
      .map((byte) => byte.toString(16).padStart(2, "0"))
      .join("");
  }
  return `local-${btoa(unescape(encodeURIComponent(value)))}`;
}

function readDemoCredentials(): DemoCredential[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(AUTH_KEY);
  if (!raw) return [];
  try {
    const rows = JSON.parse(raw) as DemoCredential[];
    return Array.isArray(rows) ? rows : [];
  } catch {
    return [];
  }
}

function saveDemoCredentials(rows: DemoCredential[]) {
  window.localStorage.setItem(AUTH_KEY, JSON.stringify(rows));
}

async function ensureSeedCredentials() {
  const db = getDemoDb();
  const rows = readDemoCredentials();
  let changed = false;

  for (const userId of Object.keys(seedPasswords) as Array<keyof typeof seedPasswords>) {
    const user = db.users.find((row) => row.id === userId);
    if (!user) continue;
    const exists = rows.some((row) => row.userId === userId);
    if (!exists) {
      rows.push({
        userId,
        email: normalizeEmail(user.email),
        passwordHash: await hashPassword(seedPasswords[userId]),
      });
      changed = true;
    }
  }

  if (changed) saveDemoCredentials(rows);
  return rows;
}

export async function loginDemoWithCredentials(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  const db = getDemoDb();
  const user = db.users.find((row) => normalizeEmail(row.email) === normalizedEmail);

  if (!user) throw new Error("Email atau password salah.");
  if (user.verificationStatus === "pending") {
    throw new Error("Akun sudah terdaftar dan masih menunggu verifikasi Admin HASILTANI.");
  }
  if (user.verificationStatus === "rejected") {
    throw new Error("Akun ini belum dapat digunakan karena verifikasinya ditolak.");
  }

  const credentials = await ensureSeedCredentials();
  const credential = credentials.find((row) => row.userId === user.id);
  if (!credential) throw new Error("Kredensial akun tidak ditemukan. Daftarkan ulang akun lokal ini.");

  const incomingHash = await hashPassword(password);
  if (credential.passwordHash !== incomingHash) throw new Error("Email atau password salah.");

  setDemoSession(user);
  return user;
}

export async function registerDemoUser(input: {
  name: string;
  email: string;
  password: string;
  role: "petani" | "buyer";
  organization?: string;
  location?: string;
}) {
  const db = getDemoDb();
  const normalizedEmail = normalizeEmail(input.email);

  if (db.users.some((row) => normalizeEmail(row.email) === normalizedEmail)) {
    throw new Error("Email sudah terdaftar. Silakan masuk menggunakan akun tersebut.");
  }

  const user = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    email: normalizedEmail,
    role: input.role,
    organization: input.organization?.trim() || undefined,
    location: input.location?.trim() || undefined,
    verificationStatus: "pending" as const,
  } as SessionUser & { location?: string };

  db.users.unshift(user);
  saveDemoDb(db);

  const credentials = await ensureSeedCredentials();
  credentials.push({
    userId: user.id,
    email: normalizedEmail,
    passwordHash: await hashPassword(input.password),
  });
  saveDemoCredentials(credentials);

  return user;
}


export async function uploadBatchPhoto(userId: string, file: File): Promise<string | null> {
  if (!isSupabaseMode()) return null;
  const supabase = getSupabase();
  if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
  const ext = (file.name.split(".").pop() || "jpg").replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("batch-photos").upload(path, file, { contentType: file.type || "image/jpeg", upsert: false });
  if (error) throw error;
  return path;
}

export async function createDemoBatch(input: Omit<Batch, "id" | "createdAt">) {
  if (isSupabaseMode()) {
    const supabase = getSupabase(); if (!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const { data, error } = await supabase.from("batches").insert({farmer_id:input.farmerId,commodity:input.commodity,weight_kg:input.weightKg,location:input.location,harvest_date:input.harvestDate,status:input.status,cover_image_url:input.coverImage ?? null}).select("id,created_at").single();
    if (error) throw error;
    if (input.condition && input.conditionLabel && input.confidence != null && input.routingStatus) {
      const { error: gradingError } = await supabase.from("grading_results").insert({batch_id:data.id,condition_raw:input.condition,condition_label:input.conditionLabel,confidence:input.confidence,routing_status:input.routingStatus,model_version:input.modelVersion ?? "HASILTANI-unknown",mode:input.analysisMode ?? "demo"});
      if (gradingError) throw gradingError;
    }
    if (input.routes?.length) {
      const { error: routeError } = await supabase.from("use_recommendations").insert(input.routes.map((route) => ({
        batch_id: data.id, destination_type: route.name, score: route.score, rule_version: route.rule_version, reason: route.reason,
      })));
      if (routeError) throw routeError;
    }
    await supabase.from("impact_records").insert({actor_id:input.farmerId,event_type:"analyzed",weight_kg:input.weightKg,commodity:input.commodity,related_id:data.id});
    emitDbRefresh();
    return {...input,id:data.id,createdAt:data.created_at} as Batch;
  }
  const db = getDemoDb();
  const batch: Batch = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  db.batches.unshift(batch);
  db.impact.analyzedKg += batch.weightKg;
  saveDemoDb(db);
  return batch;
}

export async function updateDemoBatch(id: string, patch: Partial<Batch>) {
  if (isSupabaseMode()) {
    const supabase=getSupabase(); if(!supabase) throw new Error("Supabase belum dikonfigurasi.");
    const dbPatch:any={}; if(patch.status) dbPatch.status=patch.status; if(patch.weightKg!=null) dbPatch.weight_kg=patch.weightKg; if(patch.location) dbPatch.location=patch.location; if(patch.harvestDate) dbPatch.harvest_date=patch.harvestDate;
    if(Object.keys(dbPatch).length){const {error}=await supabase.from("batches").update(dbPatch).eq("id",id); if(error)throw error;}
    emitDbRefresh(); return null;
  }
  const db = getDemoDb();
  const index = db.batches.findIndex((b) => b.id === id);
  if (index < 0) return null;
  db.batches[index] = { ...db.batches[index], ...patch };
  saveDemoDb(db);
  return db.batches[index];
}

export async function createDemoDemand(input: Omit<Demand, "id" | "createdAt">) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {data,error}=await supabase.from("buyer_demands").insert({buyer_id:input.buyerId,commodity:input.commodity,accepted_conditions:input.acceptedConditions,minimum_volume_kg:input.minimumVolumeKg,offer_price_per_kg:input.offerPricePerKg,location:input.location,radius_km:input.radiusKm,deadline:input.deadline,status:input.status}).select("id,created_at").single();if(error)throw error;emitDbRefresh();return {...input,id:data.id,createdAt:data.created_at} as Demand;}
  const db = getDemoDb();
  const demand: Demand = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  db.demands.unshift(demand);
  saveDemoDb(db);
  return demand;
}

export async function createDemoPool(input: Omit<Pool, "id" | "createdAt">) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {data:{user}}=await supabase.auth.getUser();if(!user)throw new Error("Sesi tidak tersedia.");const {data,error}=await supabase.from("harvest_pools").insert({target_demand_id:input.targetDemandId,created_by:user.id,total_weight_kg:input.totalWeightKg,status:input.status}).select("id,created_at").single();if(error)throw error;if(input.memberBatchIds.length){const {data:batchRows,error:batchError}=await supabase.from("batches").select("id,weight_kg").in("id",input.memberBatchIds);if(batchError)throw batchError;const {error:memberError}=await supabase.from("pool_members").insert((batchRows??[]).map((row:any)=>({pool_id:data.id,batch_id:row.id,accepted_weight_kg:Number(row.weight_kg)})));if(memberError)throw memberError;}await supabase.from("impact_records").insert({actor_id:user.id,event_type:"pooled",weight_kg:input.totalWeightKg,commodity:input.commodity,related_id:data.id});emitDbRefresh();return {...input,id:data.id,createdAt:data.created_at} as Pool;}
  const db = getDemoDb();
  const pool: Pool = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  db.pools.unshift(pool);
  db.impact.pooledKg += input.totalWeightKg;
  saveDemoDb(db);
  return pool;
}

export async function createDemoOffer(input: Omit<Offer, "id" | "createdAt">) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {data,error}=await supabase.from("offers").insert({demand_id:input.demandId,batch_id:input.batchId??null,pool_id:input.poolId??null,seller_id:input.sellerId,buyer_id:input.buyerId,offered_price_per_kg:input.offeredPricePerKg,accepted_weight_kg:input.acceptedWeightKg,status:input.status}).select("id,created_at").single();if(error)throw error;emitDbRefresh();return {...input,id:data.id,createdAt:data.created_at} as Offer;}
  const db = getDemoDb();
  const offer: Offer = { ...input, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  db.offers.unshift(offer);
  saveDemoDb(db);
  return offer;
}

export async function updateDemoOffer(id: string, status: Offer["status"]) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {data:offer,error:readError}=await supabase.from("offers").select("seller_id,accepted_weight_kg").eq("id",id).single();if(readError)throw readError;const {error}=await supabase.from("offers").update({status}).eq("id",id);if(error)throw error;if(status==="accepted")await supabase.from("impact_records").insert({actor_id:offer.seller_id,event_type:"offer_accepted",weight_kg:offer.accepted_weight_kg,related_id:id});emitDbRefresh();return null;}
  const db = getDemoDb();
  const offer = db.offers.find((o) => o.id === id);
  if (!offer) return null;
  offer.status = status;
  if (status === "accepted") db.impact.routedKg += offer.acceptedWeightKg;
  saveDemoDb(db);
  return offer;
}

export async function updateDemoVerification(id: string, status: SessionUser["verificationStatus"]) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {error}=await supabase.from("profiles").update({verification_status:status}).eq("id",id);if(error)throw error;emitDbRefresh();return null;}
  const db = getDemoDb();
  const user = db.users.find((u) => u.id === id);
  if (!user) return null;
  user.verificationStatus = status;
  saveDemoDb(db);
  return user;
}

export async function resolveDemoFlag(id: string) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {error}=await supabase.from("moderation_flags").update({status:"resolved"}).eq("id",id);if(error)throw error;emitDbRefresh();return null;}
  const db = getDemoDb();
  const flag = db.moderation.find((f) => f.id === id);
  if (!flag) return null;
  flag.status = "resolved";
  saveDemoDb(db);
  return flag;
}

export async function toggleDemoRule(id: string) {
  if(isSupabaseMode()){const supabase=getSupabase();if(!supabase)throw new Error("Supabase belum dikonfigurasi.");const {data,error:readError}=await supabase.from("routing_rules").select("is_active").eq("id",id).single();if(readError)throw readError;const {error}=await supabase.from("routing_rules").update({is_active:!data.is_active,updated_at:new Date().toISOString()}).eq("id",id);if(error)throw error;emitDbRefresh();return null;}
  const db = getDemoDb();
  const rule = db.rules.find((r) => r.id === id);
  if (!rule) return null;
  rule.active = !rule.active;
  saveDemoDb(db);
  return rule;
}
