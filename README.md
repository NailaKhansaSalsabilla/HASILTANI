# HASILTANI

**Setiap Panen Punya Jalur. Setiap Hasil Punya Nilai.**

HASILTANI adalah platform terintegrasi untuk membantu petani mengenali kondisi visual hasil tani, memverifikasi hasil analisis, dan mengarahkannya ke jalur pemanfaatan yang relevan. Alur yang sama menghubungkan Petani, Buyer/Pengolah, dan Admin tanpa mengubah analisis visual menjadi klaim keamanan pangan.

## Fitur utama

### Public / Guest
- Landing page responsif dengan animasi GSAP.
- Guest Scan tanpa login.
- Kamera langsung atau unggah 1–3 foto.
- Hasil kondisi visual, confidence, human verification, Smart Destination, dan referensi nilai.

### Petani
- Dashboard batch hasil tani.
- Pembuatan batch dengan foto aktual.
- Analisis 4 komoditas: Tomat, Pisang, Mangga, dan Jeruk.
- Buyer Match, Offer, Harvest Pool, dan Impact Ledger.

### Buyer / Pengolah
- Demand berdasarkan komoditas, kondisi, volume, radius, deadline, dan offer/kg.
- Pencocokan demand dengan supply.
- Accept / Reject offer.

### Admin
- Overview ekosistem.
- Verifikasi akun.
- Routing rules.
- Moderasi.
- Impact Ledger.

## AI dan pengambilan keputusan

HASILTANI menggunakan arsitektur AI **hierarkis berbasis MobileNetV3-Small**.

Tahap pertama menggunakan **shared spoilage guard** (`spoilage.pt`) untuk membedakan kondisi `fresh` dan `rotten`. Jika hasil tidak dikategorikan `rotten`, inferensi dilanjutkan ke model tahap kematangan sesuai komoditas:

- `pisang_stage.pt`
- `mangga_stage.pt`
- `jeruk_stage.pt`
- `tomat_stage.pt`

Hasil inferensi kemudian dipetakan ke empat kondisi yang ditampilkan pada aplikasi: **Belum Matang**, **Matang**, **Terlalu Matang**, dan **Rusak/Busuk Berat**.

Model AI hanya mengklasifikasikan **kondisi visual**. Human verification tetap menjadi bagian alur sebelum hasil digunakan untuk keputusan lanjutan. Smart Destination ditentukan oleh rule engine transparan, sedangkan nilai transaksi berasal dari referensi pasar atau offer buyer.

HASILTANI tidak mengklaim keamanan pangan, kadar gula, penyakit, atau kandungan kimia hanya dari foto.

## Teknologi

- Frontend: Next.js 16, React 19, TypeScript, GSAP, Lucide React
- Backend: FastAPI, PyTorch, Torchvision
- AI: MobileNetV3-Small, TTA, multi-photo consensus
- Data adapter: local demo atau Supabase
- Database schema: PostgreSQL / Supabase dengan RLS

## Quick start Windows

Prasyarat:
- Node.js 20.9+
- Python 3.11–3.13

Dari root repository:

```text
scripts\SETUP_WINDOWS.bat
scripts\START_LOCAL.bat
```

Buka:

```text
http://localhost:3000
```

API docs:

```text
http://127.0.0.1:8000/docs
```

`SETUP_WINDOWS.bat` membuat environment lokal dari file `.env.example` jika belum ada.

## Login demo

Mode default adalah `NEXT_PUBLIC_DATA_MODE=demo`.

Credential demo:
- Petani: `petani@hasiltani.local` / `Petani123!`
- Buyer/Pengolah: `buyer@hasiltani.local` / `Buyer123!`
- Admin: `admin@hasiltani.local` / `Admin123!`

Registrasi lokal juga tersedia. Akun baru berstatus pending sampai diverifikasi Admin.

## Dataset dan training

Dataset besar tidak disimpan di repository. Letakkan:

```text
ai/raw/pisang.zip
ai/raw/tomat.zip
ai/raw/fruit_ripeness_kaggle.zip
```

Kemudian:

```text
scripts\PREPARE_AI_DATASETS_WINDOWS.bat
scripts\TRAIN_ALL_MODELS_WINDOWS.bat
```

Model runtime final berada di `backend/models/` dan sengaja disertakan karena ukurannya masih sesuai untuk repository biasa.

Detail pipeline: `docs/AI_PIPELINE.md`.

## Struktur repository

```text
HASILTANI/
├─ frontend/        Next.js UI, role flows, assets
├─ backend/         FastAPI inference, routing, matching
├─ ai/              dataset preparation, training, evaluation
├─ supabase/        migrations, RLS, storage schema
├─ scripts/         setup, start, prepare, train
├─ docs/            architecture, AI pipeline, QA
├─ .gitignore
└─ README.md
```

## Dokumen teknis

- `docs/ARCHITECTURE.md`
- `docs/AI_PIPELINE.md`
- `docs/QA_CHECKLIST.md`

## Prinsip produk

1. Guest dapat melakukan scan tanpa login.
2. Tiga role login tetap terpisah: Petani, Buyer/Pengolah, Admin.
3. Kamera dan galeri sama-sama didukung.
4. Confidence model bukan sertifikasi keamanan pangan.
5. Human verification mendahului keputusan lanjutan.
6. Routing dan matching dapat diaudit terpisah dari model AI.
