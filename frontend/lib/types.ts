export type Role = "petani" | "buyer" | "admin";
export type Commodity = "pisang" | "mangga" | "jeruk" | "tomat";

export type RouteCandidate = {
  name: string;
  score: number;
  reason: string;
  rule_version: string;
};

export type ConditionOption = {
  raw_class: string;
  label: string;
  restricted: boolean;
  routes: RouteCandidate[];
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  organization?: string;
  verificationStatus: "pending" | "verified" | "rejected";
};

export type AnalysisResult = {
  commodity: Commodity;
  commodity_label: string;
  raw_class: string | null;
  condition_label: string | null;
  confidence: number;
  routing_status: "READY" | "REVIEW" | "RESTRICTED";
  review_reason?: "LOW_CONFIDENCE" | "VISUAL_CONFIRMATION" | "CONDITION_CONFIRMATION" | null;
  requires_visual_confirmation?: boolean;
  operational_threshold?: number;
  mode: "model" | "demo";
  model_version: string;
  message: string;
  predictions: Array<{
    filename: string;
    raw_class: string;
    label: string;
    confidence: number;
  }>;
  routes: RouteCandidate[];
  candidate_routes?: RouteCandidate[];
  restricted_routes?: RouteCandidate[];
  condition_options?: ConditionOption[];
  reference_price: number;
  heatmap_data_url?: string | null;
};

export type Batch = {
  id: string;
  farmerId: string;
  commodity: Commodity;
  weightKg: number;
  location: string;
  harvestDate: string;
  status: "draft" | "analyzed" | "matched" | "pooled" | "offered";
  condition?: string;
  conditionLabel?: string;
  confidence?: number;
  routingStatus?: "READY" | "REVIEW" | "RESTRICTED";
  coverImage?: string;
  modelVersion?: string;
  analysisMode?: "model" | "demo";
  routes?: AnalysisResult["routes"];
  createdAt: string;
};

export type Demand = {
  id: string;
  buyerId: string;
  buyerName: string;
  commodity: Commodity;
  acceptedConditions: string[];
  minimumVolumeKg: number;
  offerPricePerKg: number;
  location: string;
  radiusKm: number;
  deadline: string;
  status: "active" | "paused" | "closed";
  createdAt: string;
};

export type Pool = {
  id: string;
  targetDemandId: string;
  memberBatchIds: string[];
  totalWeightKg: number;
  targetWeightKg: number;
  status: "forming" | "ready" | "offered" | "closed";
  commodity: Commodity;
  createdAt: string;
};

export type Offer = {
  id: string;
  demandId: string;
  batchId?: string;
  poolId?: string;
  sellerId: string;
  buyerId: string;
  buyerName: string;
  offeredPricePerKg: number;
  acceptedWeightKg: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  createdAt: string;
};

export type RoutingRule = {
  id: string;
  commodity: Commodity;
  condition: string;
  destination: string;
  score: number;
  reason: string;
  active: boolean;
};

export type ModerationFlag = { id: string; targetType: string; reason: string; status: "open" | "resolved"; createdAt: string };

export type DemoDb = {
  users: SessionUser[];
  batches: Batch[];
  demands: Demand[];
  pools: Pool[];
  offers: Offer[];
  rules: RoutingRule[];
  moderation: ModerationFlag[];
  impact: {
    analyzedKg: number;
    matchedKg: number;
    pooledKg: number;
    routedKg: number;
  };
};
