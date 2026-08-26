# HASILTANI Q1 — Dataset Sources and Label Policy

## Final label vocabulary

Every commodity exposes the same four final visual conditions:

- `unripe` — Belum Matang
- `ripe` — Matang
- `overripe` — Terlalu Matang
- `rotten` — Rusak / Busuk Berat

The Q1 pipeline is **hierarchical**, not a single flat four-class classifier:

1. A per-commodity stage model classifies `unripe / ripe / overripe`.
2. A shared spoilage guard classifies `fresh / rotten`.
3. Inference combines both outputs into one of the four final labels.
4. Ambiguous results stay `REVIEW` and require human verification.

This separation is intentional. Spoilage/rot is not assumed to be merely the next ripeness stage.

## Spoilage guard source — primary new source

**Spoiled and fresh fruit inspection dataset**  
Cesar Giovany Pachon Suescun, Javier Orlando Pinzón Arenas, Robinson Jiménez-Moreno.  
Mendeley Data, Version 1. DOI: `10.17632/6ps7gtp2wg.1`  
License: **CC BY 4.0**.

The original dataset contains eight fruits, 2,000 images per fruit, with half fresh and half spoiled. HASILTANI Q1 uses only:

- Banana
- Mango
- Orange
- Tomato

The source description states that backgrounds, rotation, capture distance, and lighting were varied. A balanced subset is downloaded automatically from a public GitHub mirror referenced by the preparation script. The original DOI above is the authoritative dataset source and license reference.

## Stage seed

The stage seed bundled with the local installer was curated from datasets already used/provided during HASILTANI development. It is copied only into `ai/quality_data/`, which is git-ignored.

Important preparation changes:

- Banana: Roboflow 3x augment variants are grouped by original source filename; only one representative is retained to reduce train/test leakage. Overripe source groups explicitly named `mold` are excluded from the stage model because they overlap semantically with spoilage.
- Tomato: `Old` is canonicalized to `overripe`. `Damaged` is excluded from the stage model because damage/spoilage is handled by the separate guard.
- Mango: the existing three-stage source is combined with a second local mango source for source diversity; A/B captures are grouped by fruit identity.
- Orange: the existing three-stage source is retained as a smaller stage dataset, so inference intentionally uses a conservative review gate rather than forcing uncertain predictions.
- Exact duplicate files across splits are removed; conflicting exact duplicates across labels are removed entirely.

Because some stage sources originated from user-provided/local datasets with source-specific terms, do **not** commit the bundled stage image files to the public competition repository unless their original redistribution license has been independently confirmed. The `.gitignore` keeps `ai/quality_data/` local by design.

## Deployment limitation

Internal validation/test metrics are not enough to claim robust real-world accuracy. Before judging/deployment, test each commodity with independent phone photos that were never used in training. Human verification remains a required product guardrail.
