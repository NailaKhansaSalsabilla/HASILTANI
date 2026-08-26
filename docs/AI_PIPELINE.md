# Pipeline AI HASILTANI

## Tujuan

AI mengklasifikasikan **kondisi visual** komoditas. Output model bukan keputusan keamanan pangan dan bukan penentu harga.

## Komoditas

- Pisang: `unripe`, `ripe`, `overripe`, `rotten`
- Tomat: `unripe`, `ripe`, `old`, `damaged`
- Mangga: `unripe`, `ripe`, `overripe`
- Jeruk: `unripe`, `ripe`, `overripe`

## Alur inferensi

```text
1–3 foto
   ↓
quality-aware preprocessing
   ↓
test-time augmentation (TTA)
   ↓
MobileNetV3-Small sesuai komoditas
   ↓
multi-photo consensus
   ↓
prediksi + confidence
   ↓
human verification
   ↓
Smart Destination / routing
```

Human verification dipertahankan karena foto nyata dapat berbeda dari distribusi dataset pelatihan.

## Persiapan dataset

Dataset tidak disimpan di repository. Input yang diharapkan:

```text
ai/raw/pisang.zip
ai/raw/tomat.zip
ai/raw/fruit_ripeness_kaggle.zip
```

`prepare_datasets.py` mengorkestrasi:
- `prepare_pisang_tomat.py`
- `prepare_mangga_jeruk.py`

Mangga dan Jeruk menggunakan exact-deduplication sebelum split. Laporan audit tersedia di `ai/reports/dataset_audit_mangga_jeruk.json`.

## Training

```text
python ai/train.py pisang
python ai/train.py tomat
python ai/train.py mangga
python ai/train.py jeruk
```

Output:
- `backend/models/<komoditas>.pt`
- `backend/models/<komoditas>.json`

## Evaluasi foto nyata

Gunakan foto HP yang benar-benar terpisah dari training pada:

```text
ai/external_real/<komoditas>/<kelas>/
```

Lalu jalankan `evaluate_real_photos.py`. Evaluasi eksternal digunakan sebagai stress test domain shift, bukan pengganti test-set internal.
