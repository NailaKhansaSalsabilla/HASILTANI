from __future__ import annotations

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .catalog import (
    COMMODITIES,
    condition_label,
    condition_options,
    restricted_route_candidates,
    route_candidates,
)
from .config import settings
from .inference import predict_demo, predict_with_model
from .matching import score_matches
from .schemas import AnalyzeResponse, BatchMatchInput, BatchMatchResponse, ImagePrediction

app = FastAPI(
    title="HASILTANI Intelligence API",
    version="1.1.0-quality",
    description=(
        "Hierarchical visual condition analysis + transparent routing/matching for HASILTANI. "
        "The model does not claim food safety, chemical composition, disease diagnosis, or universal quality certification."
    ),
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_origin, "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {"service": "HASILTANI Intelligence API", "status": "ok", "pipeline": "hierarchical-q1"}


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_dir": str(settings.model_dir),
        "demo_fallback": settings.allow_demo_fallback,
        "required_models": [
            "spoilage.pt/json",
            "pisang_stage.pt/json",
            "mangga_stage.pt/json",
            "jeruk_stage.pt/json",
            "tomat_stage.pt/json",
        ],
    }


@app.get("/v1/catalog")
def catalog():
    return COMMODITIES


@app.post("/v1/analyze", response_model=AnalyzeResponse)
async def analyze(
    commodity: str = Form(...),
    files: list[UploadFile] = File(...),
):
    commodity = commodity.strip().lower()
    if commodity not in COMMODITIES:
        raise HTTPException(status_code=400, detail="Komoditas tidak didukung.")
    if not 1 <= len(files) <= 3:
        raise HTTPException(status_code=400, detail="Gunakan 1 sampai 3 foto.")

    images: list[tuple[str, bytes]] = []
    for item in files:
        if item.content_type and not item.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail=f"{item.filename} bukan file gambar.")
        content = await item.read()
        if len(content) > 10 * 1024 * 1024:
            raise HTTPException(status_code=400, detail="Ukuran maksimum tiap foto adalah 10 MB.")
        images.append((item.filename or "hasil-tani.jpg", content))

    result = predict_with_model(commodity, images)
    mode = "model"
    if result is None:
        if not settings.allow_demo_fallback:
            raise HTTPException(
                status_code=503,
                detail=(
                    "Hierarchical quality model belum lengkap. Jalankan PREPARE_AI_DATASETS_WINDOWS.bat lalu "
                    "TRAIN_ALL_MODELS_WINDOWS.bat. Dibutuhkan 4 stage model + 1 shared spoilage guard."
                ),
            )
        result = predict_demo(commodity, images)
        mode = "demo"

    raw_class = result["raw_class"]
    label = condition_label(commodity, raw_class)
    confidence = float(result["confidence"])

    operational_threshold = float(COMMODITIES[commodity].get("operational_threshold", 0.60))
    damage_auto_threshold = float(COMMODITIES[commodity].get("damage_auto_threshold", 0.82))
    explicit_damage = raw_class == "rotten"

    candidate_routes = route_candidates(commodity, raw_class)
    restricted_routes = restricted_route_candidates(commodity)
    options = condition_options(commodity)

    review_reason = None
    requires_visual_confirmation = False

    if explicit_damage:
        # Rot/spoilage is high-risk. Only a strong, internally consistent result is
        # automatically restricted; everything around the boundary remains REVIEW.
        if bool(result["review"]) or confidence < damage_auto_threshold:
            status = "REVIEW"
            review_reason = "CONDITION_CONFIRMATION"
            routes = []
            message = (
                "Spoilage guard melihat indikasi rusak/busuk, tetapi keputusan non-pangan belum dikunci otomatis. "
                "Konfirmasi kondisi visual terlebih dahulu."
            )
        else:
            status = "RESTRICTED"
            routes = restricted_routes
            message = (
                "Spoilage guard mendeteksi indikasi rusak/busuk dengan keyakinan tinggi. Jalur pangan ditahan sebagai guardrail; "
                "pengguna/buyer tetap harus melakukan verifikasi visual."
            )
    else:
        low_confidence = confidence < operational_threshold or bool(result["review"])
        if low_confidence:
            status = "REVIEW"
            review_reason = "LOW_CONFIDENCE"
            routes = []
            message = (
                "AI tetap menampilkan kandidat kondisi, tetapi confidence/consensus belum cukup kuat untuk routing otomatis. "
                "Konfirmasi kondisi yang benar-benar terlihat atau ambil foto ulang bila perlu."
            )
        else:
            status = "READY"
            routes = candidate_routes
            message = (
                "Model tahap kematangan menghasilkan kandidat kondisi yang cukup meyakinkan. Smart Destination tetap menunggu "
                "verifikasi pengguna dan bukan sertifikasi keamanan pangan."
            )

    if mode == "demo":
        message = "Mode demo lokal aktif. " + message

    predictions = [
        ImagePrediction(
            filename=row["filename"],
            raw_class=row["raw_class"],
            label=condition_label(commodity, row["raw_class"]),
            confidence=round(float(row["confidence"]), 4),
        )
        for row in result["rows"]
    ]

    return AnalyzeResponse(
        commodity=commodity,
        commodity_label=COMMODITIES[commodity]["display"],
        raw_class=raw_class,
        condition_label=label,
        confidence=round(confidence, 4),
        operational_threshold=operational_threshold,
        routing_status=status,
        review_reason=review_reason,
        requires_visual_confirmation=requires_visual_confirmation,
        mode=mode,
        model_version=result["version"],
        message=message,
        predictions=predictions,
        routes=routes,
        candidate_routes=candidate_routes,
        restricted_routes=restricted_routes,
        condition_options=options,
        reference_price=int(COMMODITIES[commodity]["reference_price"]),
        heatmap_data_url=result["heatmap"],
    )


@app.post("/v1/match", response_model=BatchMatchResponse)
def match(payload: BatchMatchInput):
    return BatchMatchResponse(matches=score_matches(payload))
