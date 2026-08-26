from __future__ import annotations

import argparse
import concurrent.futures
import hashlib
import io
import json
import os
import time
import urllib.error
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
QUALITY_ROOT = ROOT / "quality_data"
STAGE_ROOT = QUALITY_ROOT / "stage"
SPOILAGE_ROOT = QUALITY_ROOT / "spoilage"

# Public mirror of Mendeley "Spoiled and fresh fruit inspection dataset"
# Original DOI: 10.17632/6ps7gtp2wg.1 — CC BY 4.0.
RAW_BASE = "https://raw.githubusercontent.com/devdezzies/freshvision/main/data/spoiled-fresh/FRUIT-16K"
SOURCE_FOLDERS = {
    "pisang": ("F_Banana", "S_Banana"),
    "mangga": ("F_Mango", "S_Mango"),
    "jeruk": ("F_Orange", "S_Orange"),
    "tomat": ("F_Tomato", "S_Tomato"),
}

EXPECTED_STAGE = {"unripe", "ripe", "overripe"}
SPLIT_RATIOS = (0.70, 0.15, 0.15)


def _split_for_index(index: int, limit: int) -> str:
    train_end = max(1, int(limit * SPLIT_RATIOS[0]))
    val_end = max(train_end + 1, int(limit * (SPLIT_RATIOS[0] + SPLIT_RATIOS[1])))
    if index <= train_end:
        return "train"
    if index <= val_end:
        return "val"
    return "test"


def _valid_jpeg(path: Path) -> bool:
    if not path.exists() or path.stat().st_size < 300:
        return False
    try:
        with Image.open(path) as im:
            im.verify()
        return True
    except Exception:
        return False


def _download_bytes(url: str, retries: int = 4) -> bytes:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            request = urllib.request.Request(
                url,
                headers={"User-Agent": "HASILTANI-dataset-preparation/1.0"},
            )
            with urllib.request.urlopen(request, timeout=30) as response:
                return response.read()
        except (urllib.error.URLError, TimeoutError, ConnectionError) as exc:
            last_error = exc
            time.sleep(1.2 * (attempt + 1))
    raise RuntimeError(f"Gagal mengunduh {url}: {last_error}")


def _normalize_image(data: bytes) -> bytes:
    with Image.open(io.BytesIO(data)) as im:
        im = ImageOps.exif_transpose(im).convert("RGB")
        if im.width < 80 or im.height < 80:
            raise ValueError("Gambar terlalu kecil.")
        im.thumbnail((384, 384), Image.Resampling.LANCZOS)
        out = io.BytesIO()
        im.save(out, format="JPEG", quality=88, optimize=True, progressive=True)
        return out.getvalue()


def _download_one(job: dict) -> dict:
    destination = Path(job["destination"])
    destination.parent.mkdir(parents=True, exist_ok=True)
    if _valid_jpeg(destination):
        job["status"] = "cached"
        job["sha256"] = hashlib.sha256(destination.read_bytes()).hexdigest()
        return job

    data = _download_bytes(job["url"])
    normalized = _normalize_image(data)
    destination.write_bytes(normalized)
    job["status"] = "downloaded"
    job["sha256"] = hashlib.sha256(normalized).hexdigest()
    return job


def validate_stage_seed() -> dict:
    if not STAGE_ROOT.exists():
        raise RuntimeError(
            "Dataset stage belum ditemukan. Jalankan installer HASILTANI_AI_QUALITY_REBUILD terlebih dahulu."
        )

    audit: dict[str, dict[str, dict[str, int]]] = {}
    for commodity in SOURCE_FOLDERS:
        commodity_root = STAGE_ROOT / commodity
        if not commodity_root.exists():
            raise RuntimeError(f"Dataset stage {commodity} tidak ditemukan: {commodity_root}")
        audit[commodity] = {}
        for split in ("train", "val", "test"):
            split_root = commodity_root / split
            classes = {p.name for p in split_root.iterdir() if p.is_dir()} if split_root.exists() else set()
            if classes != EXPECTED_STAGE:
                raise RuntimeError(
                    f"Class stage {commodity}/{split} harus {sorted(EXPECTED_STAGE)}, ditemukan {sorted(classes)}"
                )
            audit[commodity][split] = {}
            for label in sorted(EXPECTED_STAGE):
                count = sum(1 for p in (split_root / label).glob("*.jpg"))
                if count < 10:
                    raise RuntimeError(f"Terlalu sedikit image: {commodity}/{split}/{label} = {count}")
                audit[commodity][split][label] = count
    return audit


def prepare_spoilage(limit_per_state: int = 300, workers: int = 8) -> dict:
    jobs: list[dict] = []
    for commodity, (fresh_folder, spoiled_folder) in SOURCE_FOLDERS.items():
        for label, folder in (("fresh", fresh_folder), ("rotten", spoiled_folder)):
            for index in range(1, limit_per_state + 1):
                split = _split_for_index(index, limit_per_state)
                filename = f"{commodity}_{label}_{index:04d}.jpg"
                jobs.append(
                    {
                        "commodity": commodity,
                        "label": label,
                        "split": split,
                        "source_index": index,
                        "url": f"{RAW_BASE}/{folder}/{index}.jpg",
                        "destination": str(SPOILAGE_ROOT / split / label / filename),
                    }
                )

    print(f"Menyiapkan spoilage guard: {len(jobs)} gambar (resume-safe).")
    completed: list[dict] = []
    failures: list[dict] = []
    with concurrent.futures.ThreadPoolExecutor(max_workers=max(1, workers)) as pool:
        future_map = {pool.submit(_download_one, dict(job)): job for job in jobs}
        done = 0
        for future in concurrent.futures.as_completed(future_map):
            done += 1
            try:
                completed.append(future.result())
            except Exception as exc:
                item = dict(future_map[future])
                item["error"] = str(exc)
                failures.append(item)
            if done % 100 == 0 or done == len(jobs):
                print(f"  {done}/{len(jobs)} selesai | gagal={len(failures)}")

    if failures:
        (QUALITY_ROOT / "spoilage_download_failures.json").write_text(
            json.dumps(failures, indent=2), encoding="utf-8"
        )
        # A few missing files are tolerable; large failure counts indicate network/source problems.
        if len(failures) > max(20, int(0.03 * len(jobs))):
            raise RuntimeError(
                f"Terlalu banyak file gagal diunduh ({len(failures)}). Jalankan script ini lagi; proses akan melanjutkan file yang belum ada."
            )

    # Remove exact duplicate images across splits. Conflicting label duplicates are removed entirely.
    by_hash: dict[str, list[Path]] = defaultdict(list)
    for path in SPOILAGE_ROOT.rglob("*.jpg"):
        by_hash[hashlib.sha256(path.read_bytes()).hexdigest()].append(path)

    removed: list[str] = []
    split_rank = {"train": 0, "val": 1, "test": 2}
    for paths in by_hash.values():
        if len(paths) <= 1:
            continue
        labels = {p.parent.name for p in paths}
        if len(labels) > 1:
            for path in paths:
                removed.append(str(path.relative_to(QUALITY_ROOT)))
                path.unlink(missing_ok=True)
        else:
            paths = sorted(paths, key=lambda p: (split_rank.get(p.parents[1].name, 9), str(p)))
            for path in paths[1:]:
                removed.append(str(path.relative_to(QUALITY_ROOT)))
                path.unlink(missing_ok=True)

    counts = Counter()
    for path in SPOILAGE_ROOT.rglob("*.jpg"):
        rel = path.relative_to(SPOILAGE_ROOT).parts
        if len(rel) >= 3:
            split, label = rel[0], rel[1]
            counts[(split, label)] += 1

    audit = {
        "source": {
            "name": "Spoiled and fresh fruit inspection dataset",
            "doi": "10.17632/6ps7gtp2wg.1",
            "license": "CC BY 4.0",
            "mirror": "https://github.com/devdezzies/freshvision",
            "note": "Only Banana, Mango, Orange, and Tomato are used. A balanced fresh/spoiled subset is downloaded for the shared spoilage guard.",
        },
        "limit_per_commodity_state": limit_per_state,
        "completed": len(completed),
        "failures": len(failures),
        "removed_exact_duplicates": removed,
        "counts": {f"{split}/{label}": count for (split, label), count in sorted(counts.items())},
    }
    (QUALITY_ROOT / "SPOILAGE_DATASET_MANIFEST.json").write_text(
        json.dumps(audit, indent=2), encoding="utf-8"
    )
    return audit


def main():
    parser = argparse.ArgumentParser(description="Prepare HASILTANI hierarchical quality dataset.")
    parser.add_argument("--spoilage-per-state", type=int, default=300, help="Images per fruit and fresh/rotten state.")
    parser.add_argument("--workers", type=int, default=8)
    args = parser.parse_args()

    stage = validate_stage_seed()
    print("Stage seed valid:")
    print(json.dumps(stage, indent=2))

    spoilage = prepare_spoilage(args.spoilage_per_state, args.workers)
    print("Spoilage dataset siap:")
    print(json.dumps(spoilage["counts"], indent=2))
    print("\nSELESAI. Dataset siap untuk training hierarchical quality models.")


if __name__ == "__main__":
    main()
