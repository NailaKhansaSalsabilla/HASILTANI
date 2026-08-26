from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field


Commodity = Literal["pisang", "mangga", "jeruk", "tomat"]
RoutingStatus = Literal["READY", "REVIEW", "RESTRICTED"]
ReviewReason = Literal["LOW_CONFIDENCE", "VISUAL_CONFIRMATION", "CONDITION_CONFIRMATION"]


class RouteCandidate(BaseModel):
    name: str
    score: int
    reason: str
    rule_version: str


class ConditionOption(BaseModel):
    raw_class: str
    label: str
    restricted: bool = False
    routes: list[RouteCandidate] = []


class ImagePrediction(BaseModel):
    filename: str
    raw_class: str
    label: str
    confidence: float


class AnalyzeResponse(BaseModel):
    commodity: Commodity
    commodity_label: str
    raw_class: str | None
    condition_label: str | None
    confidence: float
    operational_threshold: float
    routing_status: RoutingStatus
    review_reason: ReviewReason | None = None
    requires_visual_confirmation: bool = False
    mode: Literal["model", "demo"]
    model_version: str
    message: str
    predictions: list[ImagePrediction]
    routes: list[RouteCandidate]
    candidate_routes: list[RouteCandidate] = []
    restricted_routes: list[RouteCandidate] = []
    condition_options: list[ConditionOption] = []
    reference_price: int
    heatmap_data_url: str | None = None


class DemandInput(BaseModel):
    id: str
    buyer_name: str
    commodity: Commodity
    accepted_conditions: list[str]
    minimum_volume: float = Field(gt=0)
    offer_price_per_kg: int = Field(gt=0)
    distance_km: float = Field(ge=0)
    deadline_days: int = Field(ge=0)


class BatchMatchInput(BaseModel):
    commodity: Commodity
    condition: str
    volume_kg: float = Field(gt=0)
    demands: list[DemandInput]


class DemandMatch(BaseModel):
    demand_id: str
    buyer_name: str
    score: int
    offer_price_per_kg: int
    potential_value: int
    minimum_volume: float
    missing_volume: float
    pool_recommended: bool
    reasons: list[str]


class BatchMatchResponse(BaseModel):
    matches: list[DemandMatch]
