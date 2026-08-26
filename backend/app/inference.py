from __future__ import annotations

import base64
import hashlib
import io
import json
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

from .catalog import COMMODITIES
from .config import settings

try:
    import torch
    from torch import nn
    from torchvision import models, transforms
except Exception:  # pragma: no cover - backend can still expose demo mode without torch
    torch = None
    nn = None
    models = None
    transforms = None


@dataclass
class LoadedModel:
    model: object
    classes: list[str]
    threshold: float
    version: str
    input_size: int


_CACHE: dict[str, LoadedModel] = {}


def _build_model(num_classes: int):
    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    return model


def _load_model(stem: str) -> LoadedModel | None:
    if stem in _CACHE:
        return _CACHE[stem]
    if torch is None:
        return None

    meta_path = Path(settings.model_dir) / f"{stem}.json"
    weights_path = Path(settings.model_dir) / f"{stem}.pt"
    if not meta_path.exists() or not weights_path.exists():
        return None

    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    classes = list(metadata["classes"])
    model = _build_model(len(classes))
    checkpoint = torch.load(weights_path, map_location="cpu")
    state_dict = checkpoint.get("state_dict", checkpoint) if isinstance(checkpoint, dict) else checkpoint
    model.load_state_dict(state_dict)
    model.eval()

    loaded = LoadedModel(
        model=model,
        classes=classes,
        threshold=float(metadata.get("confidence_threshold", 0.68)),
        version=str(metadata.get("model_version", stem)),
        input_size=int(metadata.get("input_size", 224)),
    )
    _CACHE[stem] = loaded
    return loaded


def load_stage_model(commodity: str) -> LoadedModel | None:
    return _load_model(f"{commodity}_stage")


def load_spoilage_model() -> LoadedModel | None:
    return _load_model("spoilage")


def _transform(size: int):
    return transforms.Compose(
        [
            transforms.Resize(size + 32),
            transforms.CenterCrop(size),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
        ]
    )


def _center_crop(image: Image.Image, ratio: float = 0.92) -> Image.Image:
    width, height = image.size
    crop_w = max(1, int(width * ratio))
    crop_h = max(1, int(height * ratio))
    left = max(0, (width - crop_w) // 2)
    top = max(0, (height - crop_h) // 2)
    return image.crop((left, top, left + crop_w, top + crop_h))


def _tta_variants(image: Image.Image) -> list[Image.Image]:
    base = image.convert("RGB")
    return [
        base,
        ImageOps.mirror(base),
        ImageEnhance.Brightness(base).enhance(0.94),
        ImageEnhance.Brightness(base).enhance(1.06),
        _center_crop(base, 0.92),
    ]


def _quality_summary(image: Image.Image) -> tuple[float, list[str]]:
    gray = np.asarray(image.convert("L").resize((256, 256)), dtype=np.float32) / 255.0
    brightness = float(gray.mean())
    contrast = float(gray.std())
    edges = image.convert("L").resize((256, 256)).filter(ImageFilter.FIND_EDGES)
    sharpness = float((np.asarray(edges, dtype=np.float32) / 255.0).std())

    issues: list[str] = []
    weight = 1.0
    if brightness < 0.11:
        issues.append("foto sangat gelap")
        weight *= 0.72
    elif brightness > 0.94:
        issues.append("foto terlalu terang")
        weight *= 0.78
    if contrast < 0.075:
        issues.append("kontras sangat rendah")
        weight *= 0.82
    if sharpness < 0.045:
        issues.append("foto berpotensi blur")
        weight *= 0.78
    return max(0.45, min(1.0, weight)), issues


def _predict_tta(loaded: LoadedModel, image: Image.Image) -> np.ndarray:
    tensors = [_transform(loaded.input_size)(variant) for variant in _tta_variants(image)]
    batch = torch.stack(tensors, dim=0)
    with torch.no_grad():
        logits = loaded.model(batch)
        probs = torch.softmax(logits, dim=1)
    return probs.mean(dim=0).cpu().numpy()


def _gradcam_overlay(model, tensor, predicted_index: int, original: Image.Image) -> str | None:
    if torch is None:
        return None
    activations = []
    gradients = []
    target_layer = model.features[-1]

    def forward_hook(_module, _inputs, output):
        activations.append(output.detach())

    def backward_hook(_module, _grad_input, grad_output):
        gradients.append(grad_output[0].detach())

    h1 = target_layer.register_forward_hook(forward_hook)
    h2 = target_layer.register_full_backward_hook(backward_hook)
    try:
        model.zero_grad(set_to_none=True)
        logits = model(tensor)
        logits[0, predicted_index].backward()
        if not activations or not gradients:
            return None
        act = activations[0][0]
        grad = gradients[0][0]
        weights = grad.mean(dim=(1, 2), keepdim=True)
        cam = (weights * act).sum(dim=0).clamp(min=0)
        if float(cam.max()) <= 0:
            return None
        cam = cam / cam.max()
        cam_img = Image.fromarray(np.uint8(cam.cpu().numpy() * 255), mode="L")
        cam_img = cam_img.resize(original.size, Image.Resampling.BICUBIC).filter(ImageFilter.GaussianBlur(5))
        base = original.convert("RGBA")
        heat = Image.new("RGBA", original.size, (245, 158, 11, 0))
        heat.putalpha(cam_img.point(lambda p: int(p * 0.48)))
        overlay = Image.alpha_composite(base, heat).convert("RGB")
        out = io.BytesIO()
        overlay.thumbnail((900, 900))
        overlay.save(out, format="JPEG", quality=82, optimize=True)
        return "data:image/jpeg;base64," + base64.b64encode(out.getvalue()).decode("ascii")
    finally:
        h1.remove()
        h2.remove()


def predict_with_model(commodity: str, images: Iterable[tuple[str, bytes]]):
    """Hierarchical final-condition prediction.

    1) Shared spoilage guard learns fresh vs rotten from the same acquisition source.
    2) Per-commodity stage model learns unripe / ripe / overripe separately.
    3) The product returns one canonical final class: unripe / ripe / overripe / rotten.

    This separation intentionally prevents "rotten" from being treated as merely a later
    ripeness stage, which was the main source of overripe-vs-rotten confusion in the old
    flat classifiers.
    """
    stage_model = load_stage_model(commodity)
    spoilage_model = load_spoilage_model()
    if stage_model is None or spoilage_model is None:
        return None
    if set(stage_model.classes) != {"unripe", "ripe", "overripe"}:
        raise RuntimeError(f"Invalid stage classes for {commodity}: {stage_model.classes}")
    if set(spoilage_model.classes) != {"fresh", "rotten"}:
        raise RuntimeError(f"Invalid spoilage classes: {spoilage_model.classes}")

    image_list = list(images)
    if not image_list:
        raise ValueError("No images supplied.")

    stage_rows: list[np.ndarray] = []
    spoilage_rows: list[np.ndarray] = []
    quality_weights: list[float] = []
    quality_issues: list[str] = []
    originals: list[Image.Image] = []
    rows: list[dict] = []

    rotten_idx = spoilage_model.classes.index("rotten")

    for filename, content in image_list:
        image = Image.open(io.BytesIO(content)).convert("RGB")
        originals.append(image)
        stage_probs = _predict_tta(stage_model, image)
        spoil_probs = _predict_tta(spoilage_model, image)
        weight, issues = _quality_summary(image)
        quality_weights.append(weight)
        quality_issues.extend(f"{filename}: {issue}" for issue in issues)
        stage_rows.append(stage_probs)
        spoilage_rows.append(spoil_probs)

        stage_index = int(np.argmax(stage_probs))
        stage_class = stage_model.classes[stage_index]
        stage_conf = float(stage_probs[stage_index])
        rotten_prob = float(spoil_probs[rotten_idx])

        # Per-photo candidate is intentionally conservative. 0.62 means "possible
        # rotten"; automatic restriction still requires a much stronger aggregate gate.
        if rotten_prob >= 0.62:
            local_class = "rotten"
            local_conf = rotten_prob
        else:
            local_class = stage_class
            local_conf = stage_conf
        rows.append({"filename": filename, "raw_class": local_class, "confidence": local_conf})

    weights = np.asarray(quality_weights, dtype=np.float32)
    weights = weights / max(float(weights.sum()), 1e-8)
    stage_mean = np.average(np.stack(stage_rows), axis=0, weights=weights)
    spoilage_mean = np.average(np.stack(spoilage_rows), axis=0, weights=weights)

    stage_order = np.argsort(stage_mean)[::-1]
    stage_index = int(stage_order[0])
    second_index = int(stage_order[1])
    stage_class = stage_model.classes[stage_index]
    stage_confidence = float(stage_mean[stage_index])
    stage_margin = float(stage_mean[stage_index] - stage_mean[second_index])
    rotten_probability = float(spoilage_mean[rotten_idx])

    stage_votes = Counter(stage_model.classes[int(np.argmax(row))] for row in stage_rows)
    stage_vote_share = max(stage_votes.values()) / len(stage_rows)
    split_stage_vote = len(stage_rows) >= 2 and stage_vote_share <= 0.5
    all_low_quality = max(quality_weights) < 0.75

    # The shared guard can propose rotten from 0.62 upward. Values around the boundary
    # never auto-route; they force human review. Only high-confidence + consistent rot
    # can reach automatic RESTRICTED in main.py.
    rotten_candidate = rotten_probability >= 0.62
    spoilage_ambiguous = 0.45 <= rotten_probability < 0.82

    if rotten_candidate:
        raw_class = "rotten"
        confidence = rotten_probability
        review = rotten_probability < 0.82 or all_low_quality
        explanation_model = spoilage_model
        explanation_index = rotten_idx
    else:
        raw_class = stage_class
        confidence = stage_confidence
        review = (
            stage_confidence < stage_model.threshold
            or stage_margin < 0.12
            or split_stage_vote
            or all_low_quality
            or spoilage_ambiguous
        )
        explanation_model = stage_model
        explanation_index = stage_index

    heatmap = None
    if originals:
        tensor = _transform(explanation_model.input_size)(originals[0]).unsqueeze(0)
        heatmap = _gradcam_overlay(explanation_model.model, tensor, explanation_index, originals[0])

    return {
        "raw_class": raw_class,
        "confidence": confidence,
        "review": review,
        "rows": rows,
        "heatmap": heatmap,
        "version": f"HIER-Q1[{stage_model.version}+{spoilage_model.version}]",
        "consensus_margin": round(stage_margin, 4),
        "vote_share": round(stage_vote_share, 4),
        "quality_issues": quality_issues,
        "stage_confidence": round(stage_confidence, 4),
        "spoilage_probability": round(rotten_probability, 4),
    }


def predict_demo(commodity: str, images: Iterable[tuple[str, bytes]]):
    """Deterministic local fallback only. Real judging should use trained Q1 models."""
    image_list = list(images)
    payload = b"".join(content for _, content in image_list)
    digest = hashlib.sha256(commodity.encode("utf-8") + payload).digest()
    classes = COMMODITIES[commodity]["classes"]
    sample_defaults = {"tomat": "ripe", "pisang": "ripe", "mangga": "ripe", "jeruk": "ripe"}
    is_sample = bool(image_list) and image_list[0][0].lower().startswith("sample-")
    raw_class = sample_defaults[commodity] if is_sample else classes[digest[0] % len(classes)]
    confidence = 0.91 if is_sample else 0.76 + (digest[1] / 255.0) * 0.18
    rows = []
    for i, (filename, content) in enumerate(image_list):
        d = hashlib.sha256(content + bytes([i % 255])).digest()
        local_class = raw_class if is_sample else classes[d[0] % len(classes)]
        rows.append(
            {
                "filename": filename,
                "raw_class": local_class,
                "confidence": 0.91 if is_sample else 0.72 + (d[1] / 255.0) * 0.2,
            }
        )
    return {
        "raw_class": raw_class,
        "confidence": float(confidence),
        "review": confidence < 0.65,
        "rows": rows,
        "heatmap": None,
        "version": "DEMO-FALLBACK",
        "consensus_margin": 1.0,
        "vote_share": 1.0,
        "quality_issues": [],
        "stage_confidence": float(confidence),
        "spoilage_probability": 0.0,
    }
