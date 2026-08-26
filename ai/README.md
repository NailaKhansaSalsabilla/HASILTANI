# HASILTANI AI

Pipeline AI mengikuti label dataset yang benar-benar dipakai dan tidak memaksa seluruh komoditas menjadi Grade A/B/C.

- Pisang: `unripe`, `ripe`, `overripe`, `rotten`
- Tomat: `unripe`, `ripe`, `old`, `damaged`
- Mangga: `unripe`, `ripe`, `overripe`
- Jeruk: `unripe`, `ripe`, `overripe`

Model hanya mengklasifikasikan **kondisi visual**. Routing ke fresh market, processing, atau jalur alternatif berada pada rule engine terpisah.

## Dataset aktif

Letakkan di `ai/raw/`:

- `pisang.zip`
- `tomat.zip`
- `fruit_ripeness_kaggle.zip` — sumber Mangga + Jeruk

## Prepare

Dari root project Windows:

```text
scripts\PREPARE_AI_DATASETS_WINDOWS.bat
```

Untuk menyiapkan ulang Mangga + Jeruk saja:

```text
scripts\PREPARE_MANGGA_JERUK_WINDOWS.bat
```

Audit dataset Mangga/Jeruk tersedia di `reports/dataset_audit_mangga_jeruk.json`.

## Train

```text
python train.py pisang
python train.py tomat
python train.py mangga
python train.py jeruk
```

Model tersimpan ke `../backend/models/<komoditas>.pt` dan metadata evaluasi ke `.json`.

## Uji foto HP nyata

Siapkan foto terpisah dari training pada `external_real/<komoditas>/<kelas>/`, lalu jalankan:

```text
python evaluate_real_photos.py mangga
python evaluate_real_photos.py jeruk
```

Lakukan evaluasi yang sama untuk Pisang dan Tomat sebelum submission.
