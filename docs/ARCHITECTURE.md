# Arsitektur HASILTANI

## Gambaran besar

```text
Guest / Petani
      │
      ▼
Next.js Frontend
      │
      ├── Local Demo Adapter
      │
      └── Supabase Adapter
      │
      ▼
FastAPI Backend
      │
      ├── Image Inference
      ├── Multi-photo Consensus
      ├── Routing / Smart Destination
      └── Buyer Matching
      │
      ▼
Model AI Hierarkis
Tomat · Pisang · Mangga · Jeruk
```

## Frontend

`frontend/app/` menggunakan App Router. Halaman publik, scan, serta dashboard Petani, Buyer/Pengolah, dan Admin berada pada route masing-masing. Komponen bersama ada di `frontend/components/`, sedangkan session, adapter data, API client, dan type ada di `frontend/lib/`.

Style global dipisahkan berdasarkan tanggung jawab di `frontend/app/styles/` agar urutan cascade tetap eksplisit tanpa mencampur seluruh halaman dalam satu file besar.

## Backend

`backend/app/main.py` mengekspos endpoint analisis dan matching. `inference.py` menangani pemuatan model dan inferensi, `catalog.py` menyimpan aturan jalur, dan `matching.py` menghitung kecocokan supply-demand.

## Data

Mode `demo` memakai state lokal agar seluruh flow dapat diuji tanpa layanan eksternal. Mode `supabase` memakai schema dan RLS di `supabase/migrations/`.

Field `rule_version` pada data routing adalah metadata audit aturan bisnis. Ini terpisah dari versi model AI dan bukan penanda patch source code.

## Model runtime

Lima model aktif berada di `backend/models/`:

```text
spoilage.pt
pisang_stage.pt
mangga_stage.pt
jeruk_stage.pt
tomat_stage.pt
```

Setiap model memiliki metadata `.json` pasangan untuk label dan evaluasi.
