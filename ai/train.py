from __future__ import annotations

import argparse
import copy
import json
import math
import os
import random
from collections import Counter
from pathlib import Path

import numpy as np
import torch
from sklearn.metrics import classification_report, confusion_matrix, f1_score
from torch import nn
from torch.optim import AdamW
from torch.optim.lr_scheduler import CosineAnnealingLR
from torch.utils.data import DataLoader, WeightedRandomSampler
from torchvision import datasets, models, transforms
from tqdm import tqdm

SEED = 20260819
STAGE_CLASSES = {"unripe", "ripe", "overripe"}
SPOILAGE_CLASSES = {"fresh", "rotten"}


def seed_everything(seed: int = SEED):
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


def build_transforms(size: int):
    # Keep augmentation realistic for phone/gallery photos. No vertical flip and no
    # extreme color changes because ripeness itself is color-sensitive.
    train_tf = transforms.Compose(
        [
            transforms.RandomResizedCrop(size, scale=(0.78, 1.0), ratio=(0.85, 1.15)),
            transforms.RandomHorizontalFlip(p=0.5),
            transforms.RandomRotation(8),
            transforms.RandomPerspective(distortion_scale=0.10, p=0.15),
            transforms.ColorJitter(brightness=0.18, contrast=0.15, saturation=0.15, hue=0.02),
            transforms.RandomApply([transforms.GaussianBlur(kernel_size=3, sigma=(0.1, 0.8))], p=0.08),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    eval_tf = transforms.Compose(
        [
            transforms.Resize(size + 32),
            transforms.CenterCrop(size),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
        ]
    )
    return train_tf, eval_tf


def build_model(num_classes: int, pretrained: bool = True):
    weights = models.MobileNet_V3_Small_Weights.DEFAULT if pretrained else None
    model = models.mobilenet_v3_small(weights=weights)
    in_features = model.classifier[-1].in_features
    model.classifier[-1] = nn.Linear(in_features, num_classes)
    return model


def freeze_for_warmup(model):
    for parameter in model.features.parameters():
        parameter.requires_grad = False
    for parameter in model.classifier.parameters():
        parameter.requires_grad = True


def unfreeze_tail(model):
    # Keep most ImageNet features frozen to reduce overfit and CPU training time.
    for parameter in model.features.parameters():
        parameter.requires_grad = False
    for block in list(model.features.children())[-4:]:
        for parameter in block.parameters():
            parameter.requires_grad = True
    for parameter in model.classifier.parameters():
        parameter.requires_grad = True


def make_loader(ds, batch_size: int, balanced: bool = False):
    sampler = None
    if balanced:
        counts = Counter(ds.targets)
        weights = [1.0 / counts[target] for target in ds.targets]
        sampler = WeightedRandomSampler(weights, num_samples=len(weights), replacement=True)
    return DataLoader(
        ds,
        batch_size=batch_size,
        shuffle=sampler is None and balanced,
        sampler=sampler,
        num_workers=0,  # Windows-safe and predictable on competition laptops.
        pin_memory=torch.cuda.is_available(),
    )


def run_epoch(model, loader, criterion, optimizer, device, train: bool):
    model.train(train)
    total_loss = 0.0
    y_true, y_pred, y_conf = [], [], []
    iterator = tqdm(loader, leave=False)
    for x, y in iterator:
        x, y = x.to(device), y.to(device)
        if train:
            optimizer.zero_grad(set_to_none=True)
        with torch.set_grad_enabled(train):
            logits = model(x)
            loss = criterion(logits, y)
            if train:
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 5.0)
                optimizer.step()
        probs = torch.softmax(logits, dim=1)
        conf, pred = probs.max(dim=1)
        total_loss += float(loss.item()) * x.size(0)
        y_true.extend(y.detach().cpu().tolist())
        y_pred.extend(pred.detach().cpu().tolist())
        y_conf.extend(conf.detach().cpu().tolist())
    macro_f1 = f1_score(y_true, y_pred, average="macro", zero_division=0)
    return total_loss / max(len(loader.dataset), 1), macro_f1, y_true, y_pred, y_conf


def choose_confidence_threshold(y_true, y_pred, y_conf):
    # Selective prediction: when possible, retain >=90% accepted accuracy with at
    # least 25% validation coverage. Otherwise use a conservative fallback.
    best = 0.68
    for threshold in np.arange(0.50, 0.93, 0.01):
        accepted = [(yt, yp) for conf, yt, yp in zip(y_conf, y_true, y_pred) if conf >= threshold]
        if len(accepted) < max(10, int(0.25 * len(y_true))):
            continue
        acc = sum(yt == yp for yt, yp in accepted) / len(accepted)
        if acc >= 0.90:
            best = float(threshold)
            break
    return round(best, 2)


def configure_task(args):
    if args.task == "stage":
        if not args.commodity:
            raise SystemExit("task=stage membutuhkan commodity: pisang/mangga/jeruk/tomat")
        root = args.data_dir / "stage" / args.commodity
        stem = f"{args.commodity}_stage"
        version = f"mobilenetv3-small-{args.commodity}-stage-q1"
        expected = STAGE_CLASSES
    else:
        root = args.data_dir / "spoilage"
        stem = "spoilage"
        version = "mobilenetv3-small-shared-spoilage-q1"
        expected = SPOILAGE_CLASSES
    return root, stem, version, expected


def main():
    parser = argparse.ArgumentParser(description="Train HASILTANI hierarchical visual quality models.")
    parser.add_argument("task", choices=["stage", "spoilage"])
    parser.add_argument("commodity", nargs="?", choices=["pisang", "mangga", "jeruk", "tomat"])
    parser.add_argument("--data-dir", type=Path, default=Path("quality_data"))
    parser.add_argument("--output-dir", type=Path, default=Path("../backend/models"))
    parser.add_argument("--epochs", type=int, default=12)
    parser.add_argument("--warmup-epochs", type=int, default=2)
    parser.add_argument("--batch-size", type=int, default=24)
    parser.add_argument("--size", type=int, default=224)
    parser.add_argument("--lr", type=float, default=2e-4)
    parser.add_argument("--patience", type=int, default=4)
    parser.add_argument("--no-pretrained", action="store_true")
    args = parser.parse_args()

    seed_everything()
    root, stem, version, expected_classes = configure_task(args)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    train_tf, eval_tf = build_transforms(args.size)

    train_ds = datasets.ImageFolder(root / "train", transform=train_tf)
    val_ds = datasets.ImageFolder(root / "val", transform=eval_tf)
    test_ds = datasets.ImageFolder(root / "test", transform=eval_tf)

    if train_ds.classes != val_ds.classes or train_ds.classes != test_ds.classes:
        raise RuntimeError("Class mapping differs across train/val/test.")
    if set(train_ds.classes) != expected_classes:
        raise RuntimeError(f"Expected classes {sorted(expected_classes)}, found {train_ds.classes}")

    model = build_model(len(train_ds.classes), pretrained=not args.no_pretrained).to(device)
    freeze_for_warmup(model)
    criterion = nn.CrossEntropyLoss(label_smoothing=0.04)

    train_loader = make_loader(train_ds, args.batch_size, balanced=True)
    val_loader = make_loader(val_ds, args.batch_size)
    test_loader = make_loader(test_ds, args.batch_size)

    best_state = None
    best_f1 = -math.inf
    wait = 0
    history = []
    optimizer = AdamW((p for p in model.parameters() if p.requires_grad), lr=6e-4, weight_decay=1e-4)
    scheduler = None

    print(f"Training {stem} on {device} | classes={train_ds.classes} | n={len(train_ds)}")
    for epoch in range(1, args.epochs + 1):
        if epoch == args.warmup_epochs + 1:
            unfreeze_tail(model)
            optimizer = AdamW((p for p in model.parameters() if p.requires_grad), lr=args.lr, weight_decay=1e-4)
            scheduler = CosineAnnealingLR(optimizer, T_max=max(args.epochs - args.warmup_epochs, 1))
            print("Fine-tuning last MobileNetV3 feature blocks.")

        tr_loss, tr_f1, *_ = run_epoch(model, train_loader, criterion, optimizer, device, True)
        va_loss, va_f1, yv, pv, cv = run_epoch(model, val_loader, criterion, optimizer, device, False)
        if scheduler is not None:
            scheduler.step()
        history.append(
            {
                "epoch": epoch,
                "train_loss": tr_loss,
                "train_macro_f1": tr_f1,
                "val_loss": va_loss,
                "val_macro_f1": va_f1,
            }
        )
        print(f"epoch {epoch:02d} | train f1={tr_f1:.4f} | val f1={va_f1:.4f}")
        if va_f1 > best_f1 + 1e-4:
            best_f1 = va_f1
            best_state = copy.deepcopy(model.state_dict())
            wait = 0
        else:
            wait += 1
            if epoch > args.warmup_epochs + 1 and wait >= args.patience:
                print("Early stopping.")
                break

    if best_state is None:
        raise RuntimeError("Training did not produce a model.")

    model.load_state_dict(best_state)
    _, _, yv, pv, cv = run_epoch(model, val_loader, criterion, optimizer, device, False)
    threshold = choose_confidence_threshold(yv, pv, cv)
    _, test_f1, yt, pt, ct = run_epoch(model, test_loader, criterion, optimizer, device, False)

    args.output_dir.mkdir(parents=True, exist_ok=True)
    weight_path = args.output_dir / f"{stem}.pt"
    meta_path = args.output_dir / f"{stem}.json"
    torch.save({"state_dict": model.cpu().state_dict()}, weight_path)

    report = classification_report(yt, pt, target_names=train_ds.classes, output_dict=True, zero_division=0)
    metadata = {
        "task": args.task,
        "commodity": args.commodity,
        "classes": train_ds.classes,
        "input_size": args.size,
        "model_version": version,
        "confidence_threshold": threshold,
        "best_val_macro_f1": round(float(best_f1), 6),
        "test_macro_f1": round(float(test_f1), 6),
        "test_report": report,
        "confusion_matrix": confusion_matrix(yt, pt).tolist(),
        "history": history,
        "dataset_root": str(root),
        "notes": [
            "Hierarchical HASILTANI quality model.",
            "Stage models distinguish unripe / ripe / overripe only.",
            "Shared spoilage guard distinguishes fresh / rotten separately to avoid treating rot as merely a later ripeness stage.",
            "Prediction is visual-condition support, not food-safety certification or disease diagnosis.",
            "Real phone-photo evaluation remains required before judging/deployment.",
        ],
    }
    meta_path.write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(f"Saved: {weight_path}")
    print(f"Saved: {meta_path}")
    print(f"Test macro-F1: {test_f1:.4f} | confidence threshold: {threshold:.2f}")


if __name__ == "__main__":
    main()
