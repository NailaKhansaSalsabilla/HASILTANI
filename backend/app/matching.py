from __future__ import annotations

from .schemas import BatchMatchInput


def score_matches(payload: BatchMatchInput):
    matches = []
    for demand in payload.demands:
        if demand.commodity != payload.commodity:
            continue

        reasons: list[str] = []
        score = 0.0

        if payload.condition in demand.accepted_conditions:
            score += 35
            reasons.append("Kondisi visual diterima buyer")
        else:
            # Compatibility is a hard gate in this prototype.
            continue

        score += 20
        reasons.append("Komoditas sesuai demand")

        volume_ratio = min(payload.volume_kg / demand.minimum_volume, 1.0)
        score += 20 * volume_ratio
        if payload.volume_kg >= demand.minimum_volume:
            reasons.append("Volume memenuhi minimum buyer")
        else:
            reasons.append("Volume belum penuh; dapat dibantu Harvest Pool")

        distance_score = max(0.0, 1.0 - min(demand.distance_km, 60.0) / 60.0)
        score += 15 * distance_score
        reasons.append(f"Jarak estimasi {demand.distance_km:.1f} km")

        deadline_score = 1.0 if demand.deadline_days >= 2 else 0.65
        score += 10 * deadline_score
        reasons.append(f"Deadline {demand.deadline_days} hari")

        accepted_volume = min(payload.volume_kg, demand.minimum_volume)
        potential_value = int(round(accepted_volume * demand.offer_price_per_kg))
        missing = max(0.0, demand.minimum_volume - payload.volume_kg)

        matches.append(
            {
                "demand_id": demand.id,
                "buyer_name": demand.buyer_name,
                "score": int(round(score)),
                "offer_price_per_kg": demand.offer_price_per_kg,
                "potential_value": potential_value,
                "minimum_volume": demand.minimum_volume,
                "missing_volume": round(missing, 2),
                "pool_recommended": missing > 0,
                "reasons": reasons,
            }
        )

    matches.sort(key=lambda row: (-row["score"], -row["offer_price_per_kg"]))
    return matches
