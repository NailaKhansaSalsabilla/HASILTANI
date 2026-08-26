from __future__ import annotations

# HASILTANI final visual-condition vocabulary is canonical across all commodities.
# The deployed inference is hierarchical:
#   1) shared fresh-vs-rotten guard
#   2) per-commodity ripeness stage model (unripe / ripe / overripe)
# The user still sees one of four final conditions below.
COMMODITIES = {
    "pisang": {
        "display": "Pisang",
        "classes": ["unripe", "ripe", "overripe", "rotten"],
        "labels": {
            "unripe": "Belum Matang",
            "ripe": "Matang",
            "overripe": "Terlalu Matang",
            "rotten": "Rusak / Busuk Berat",
        },
        "reference_price": 14527,
        "operational_threshold": 0.60,
        "damage_auto_threshold": 0.82,
    },
    "mangga": {
        "display": "Mangga",
        "classes": ["unripe", "ripe", "overripe", "rotten"],
        "labels": {
            "unripe": "Belum Matang",
            "ripe": "Matang",
            "overripe": "Terlalu Matang",
            "rotten": "Rusak / Busuk Berat",
        },
        "reference_price": 23033,
        "operational_threshold": 0.60,
        "damage_auto_threshold": 0.82,
    },
    "jeruk": {
        "display": "Jeruk",
        "classes": ["unripe", "ripe", "overripe", "rotten"],
        "labels": {
            "unripe": "Belum Matang",
            "ripe": "Matang",
            "overripe": "Terlalu Matang",
            "rotten": "Rusak / Busuk Berat",
        },
        "reference_price": 15000,
        "operational_threshold": 0.60,
        "damage_auto_threshold": 0.82,
    },
    "tomat": {
        "display": "Tomat",
        "classes": ["unripe", "ripe", "overripe", "rotten"],
        "labels": {
            "unripe": "Belum Matang",
            "ripe": "Matang",
            "overripe": "Terlalu Matang",
            "rotten": "Rusak / Busuk Berat",
        },
        "reference_price": 12800,
        "operational_threshold": 0.60,
        "damage_auto_threshold": 0.82,
    },
}

# Kondisi AI adalah kandidat visual untuk routing, bukan food-safety certification.
ROUTES = {
    "pisang": {
        "unripe": [
            ("Keripik Pisang", 96, "Pisang belum matang dapat menjadi kandidat bahan baku keripik bagi pengolah yang menerima kondisi ini."),
            ("Tepung / Olahan Pisang", 88, "Alternatif pengolahan untuk batch belum matang sesuai spesifikasi buyer pengolah."),
            ("Pematangan Lanjutan", 84, "Batch dapat diarahkan ke proses pematangan terkontrol sebelum masuk jalur fresh."),
        ],
        "ripe": [
            ("Fresh Market", 97, "Kondisi matang cocok untuk pasar fresh dengan distribusi relatif cepat."),
            ("Retail / Horeca", 89, "Cocok untuk retail, hotel, restoran, dan katering yang menerima buah siap konsumsi."),
            ("Smoothie / Olahan", 80, "Alternatif pengolahan ketika demand fresh tidak sesuai."),
        ],
        "overripe": [
            ("Bakery / Smoothie", 94, "Pisang terlalu matang tetapi tidak rusak berat dapat menjadi kandidat bahan olahan."),
            ("Puree / Processing", 89, "Dapat diarahkan ke pengolah setelah kondisi fisik dan syarat penerimaan diverifikasi."),
        ],
        "rotten": [],
    },
    "mangga": {
        "unripe": [
            ("Asinan / Pickle / Olahan", 94, "Mangga belum matang dapat cocok untuk pengolah yang membutuhkan karakter asam dan tekstur lebih firm."),
            ("Pematangan Lanjutan", 88, "Batch dapat ditahan pada jalur pematangan sebelum diarahkan ke pasar fresh."),
            ("Buyer Pengolah", 80, "Cocokkan dengan demand pengolah yang menerima mangga belum matang."),
        ],
        "ripe": [
            ("Fresh Market", 97, "Kondisi matang cocok untuk permintaan fresh dengan distribusi cepat."),
            ("Retail / Horeca", 89, "Cocok untuk retail, hotel, restoran, dan katering."),
            ("Juice / Dessert", 81, "Alternatif pengolahan jika demand fresh tidak terpenuhi."),
        ],
        "overripe": [
            ("Juice / Puree", 95, "Mangga terlalu matang tetapi masih layak secara visual dapat menjadi kandidat juice atau puree."),
            ("Selai / Processing", 89, "Dapat dipertimbangkan oleh pengolah setelah verifikasi kondisi fisik dan syarat penerimaan."),
        ],
        "rotten": [],
    },
    "jeruk": {
        "unripe": [
            ("Buyer Pengolah", 90, "Cocokkan dengan pengolah yang secara eksplisit menerima tingkat kematangan ini."),
            ("Sortasi & Penanganan Lanjutan", 82, "Tahan jalur fresh premium dan lakukan sortasi sesuai standar buyer sebelum distribusi."),
        ],
        "ripe": [
            ("Fresh Market", 97, "Kondisi matang cocok untuk permintaan fresh."),
            ("Retail / Horeca", 87, "Cocok untuk retail, hotel, restoran, katering, atau kebutuhan minuman segar."),
            ("Juice / Processing", 81, "Alternatif pengolahan ketika demand fresh tidak sesuai."),
        ],
        "overripe": [
            ("Juice / Processing", 93, "Jeruk terlalu matang tetapi tidak rusak berat dapat menjadi kandidat pengolahan."),
            ("Buyer Pengolah", 84, "Cocokkan hanya dengan buyer yang menerima kondisi tersebut setelah verifikasi visual."),
        ],
        "rotten": [],
    },
    "tomat": {
        "unripe": [
            ("Pematangan Lanjutan", 93, "Tomat belum matang dapat ditahan untuk mencapai tingkat kematangan yang dibutuhkan buyer."),
            ("Buyer Pengolah", 82, "Cocokkan dengan pengolah yang menerima tomat belum matang sesuai spesifikasi produk."),
        ],
        "ripe": [
            ("Fresh Market", 97, "Kondisi matang cocok untuk pasar fresh dengan distribusi cepat."),
            ("Restaurant / Catering", 90, "Cocok untuk kebutuhan horeca yang menerima tomat matang."),
            ("Saus / Sambal", 78, "Alternatif pengolahan jika demand fresh tidak cocok."),
        ],
        "overripe": [
            ("Saus / Sambal / Puree", 93, "Tomat terlalu matang tetapi tidak rusak berat dapat menjadi kandidat pengolahan."),
            ("Buyer Pengolah", 82, "Cocokkan dengan pengolah yang menerima kondisi terlalu matang sesuai standar internalnya."),
        ],
        "rotten": [],
    },
}

RESTRICTED_ROUTES = {
    "pisang": [
        ("Kompos / Bahan Organik", 100, "Prioritas non-pangan untuk hasil dengan indikasi busuk atau kerusakan berat."),
        ("Pakan Ternak — Perlu Verifikasi", 72, "Hanya kandidat bila penerima menyatakan kondisi tersebut layak dan memenuhi persyaratan pakan."),
        ("Pengolah Non-Pangan", 64, "Dapat dicocokkan dengan pengolah non-pangan yang menerima kondisi batch."),
    ],
    "tomat": [
        ("Kompos / Bahan Organik", 100, "Prioritas non-pangan untuk tomat dengan kerusakan visual berat."),
        ("Pakan Ternak — Perlu Verifikasi", 66, "Hanya kandidat setelah verifikasi kelayakan oleh penerima."),
        ("Pengolah Non-Pangan", 60, "Alternatif jika tersedia penerima non-pangan yang sesuai."),
    ],
    "mangga": [
        ("Kompos / Bahan Organik", 100, "Prioritas non-pangan bila pengguna mengonfirmasi kerusakan atau busuk berat."),
        ("Pakan Ternak — Perlu Verifikasi", 70, "Hanya kandidat setelah penerima memverifikasi kelayakan sesuai persyaratan pakan."),
        ("Pengolah Non-Pangan", 62, "Alternatif untuk batch yang tidak diteruskan ke jalur pangan."),
    ],
    "jeruk": [
        ("Kompos / Bahan Organik", 100, "Prioritas non-pangan bila pengguna mengonfirmasi kerusakan atau busuk berat."),
        ("Pakan Ternak — Perlu Verifikasi", 68, "Hanya kandidat setelah penerima memverifikasi kelayakan sesuai persyaratan pakan."),
        ("Pengolah Non-Pangan", 61, "Alternatif untuk batch yang tidak diteruskan ke jalur pangan."),
    ],
}


def condition_label(commodity: str, raw_class: str) -> str:
    return COMMODITIES[commodity]["labels"].get(raw_class, raw_class.replace("_", " ").title())


def _format_routes(rows):
    return [
        {"name": name, "score": score, "reason": reason, "rule_version": "HASILTANI-Q1.0"}
        for name, score, reason in rows
    ]


def route_candidates(commodity: str, raw_class: str):
    return _format_routes(ROUTES.get(commodity, {}).get(raw_class, []))


def restricted_route_candidates(commodity: str):
    return _format_routes(RESTRICTED_ROUTES.get(commodity, []))


def condition_options(commodity: str):
    rows = []
    for raw_class in COMMODITIES[commodity]["classes"]:
        restricted = raw_class == "rotten"
        rows.append({
            "raw_class": raw_class,
            "label": condition_label(commodity, raw_class),
            "restricted": restricted,
            "routes": restricted_route_candidates(commodity) if restricted else route_candidates(commodity, raw_class),
        })
    return rows
