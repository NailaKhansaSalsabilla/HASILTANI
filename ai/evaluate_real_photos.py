from __future__ import annotations

import argparse
import sys
from pathlib import Path

from sklearn.metrics import classification_report, confusion_matrix, f1_score

PROJECT_ROOT = Path(__file__).resolve().parents[1]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from backend.app import inference as production_inference  # noqa: E402

# Real-photo evaluation should measure classification behaviour, not spend time
# rendering Grad-CAM for every test image.
production_inference._gradcam_overlay = lambda *_args, **_kwargs: None

CLASSES = ["unripe", "ripe", "overripe", "rotten"]


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Evaluate HASILTANI hierarchical Q1 models on independent real phone photos."
    )
    parser.add_argument("commodity", choices=["pisang", "mangga", "jeruk", "tomat"])
    parser.add_argument("--real-dir", type=Path, default=Path("external_real"))
    args = parser.parse_args()

    root = args.real_dir / args.commodity
    if not root.exists():
        raise SystemExit(
            f"Folder tidak ditemukan: {root}\n"
            "Buat folder: external_real/<komoditas>/unripe|ripe|overripe|rotten"
        )

    y_true: list[str] = []
    y_pred: list[str] = []
    review_count = 0
    failures = []

    for label in CLASSES:
        folder = root / label
        if not folder.exists():
            raise SystemExit(f"Folder label tidak ditemukan: {folder}")
        images = sorted(
            p for p in folder.iterdir()
            if p.is_file() and p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
        )
        if not images:
            raise SystemExit(f"Tidak ada foto di {folder}")

        for path in images:
            try:
                result = production_inference.predict_with_model(
                    args.commodity, [(path.name, path.read_bytes())]
                )
                if result is None:
                    raise RuntimeError(
                        "Model Q1 belum lengkap. Jalankan TRAIN_ALL_MODELS_WINDOWS.bat."
                    )
                y_true.append(label)
                y_pred.append(str(result["raw_class"]))
                review_count += int(bool(result.get("review")))
            except Exception as exc:
                failures.append((str(path), str(exc)))

    if not y_true:
        raise SystemExit("Tidak ada foto yang berhasil dievaluasi.")

    print("\n=== HASILTANI REAL-PHONE HOLDOUT ===")
    print(f"Komoditas : {args.commodity}")
    print(f"Foto      : {len(y_true)}")
    print(f"REVIEW    : {review_count} ({review_count / len(y_true):.1%})")
    print("\nClassification report:")
    print(classification_report(y_true, y_pred, labels=CLASSES, zero_division=0))
    print("Macro-F1:", round(float(f1_score(y_true, y_pred, labels=CLASSES, average="macro", zero_division=0)), 4))
    print("\nConfusion matrix (rows=true, cols=pred):")
    print("labels:", CLASSES)
    print(confusion_matrix(y_true, y_pred, labels=CLASSES))

    if failures:
        print(f"\nGagal dibaca: {len(failures)}")
        for item in failures[:10]:
            print(" -", item[0], "=>", item[1])

    print(
        "\nCATATAN: gunakan foto HP yang benar-benar baru dan tidak pernah masuk dataset training. "
        "Metrik ini lebih penting untuk demo lomba daripada test set internal."
    )


if __name__ == "__main__":
    main()
