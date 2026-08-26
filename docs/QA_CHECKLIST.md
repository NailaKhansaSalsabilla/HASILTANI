# QA Checklist

## Public / Guest
- [ ] Landing desktop, tablet, dan mobile tidak overflow.
- [ ] Hero slider dan animasi tetap terbaca dengan `prefers-reduced-motion`.
- [ ] Guest Scan dapat memakai kamera.
- [ ] Guest Scan dapat memilih 1–3 foto.
- [ ] Hasil analisis menampilkan kondisi, confidence, verifikasi manusia, Smart Destination, dan referensi nilai.

## Petani
- [ ] Login Petani.
- [ ] Buat batch dengan kamera.
- [ ] Buat batch dengan galeri.
- [ ] Foto batch aktual tetap tampil setelah refresh pada mode demo.
- [ ] Detail batch menampilkan analisis dan routing.
- [ ] Buyer Match, Offer, Harvest Pool, dan Impact dapat dibuka.

## Buyer / Pengolah
- [ ] Login Buyer.
- [ ] Buat Demand.
- [ ] Matches membaca supply yang sesuai.
- [ ] Offer dapat diterima atau ditolak.

## Admin
- [ ] Login Admin.
- [ ] Verifikasi akun pending.
- [ ] Toggle Routing Rule.
- [ ] Resolve Moderation Flag.
- [ ] Impact overview terbuka.

## AI
- [ ] Lima model `.pt` dan metadata `.json` tersedia (1 shared spoilage guard + 4 stage model per komoditas).
- [ ] Foto HP eksternal diuji terpisah.
- [ ] Macro-F1 dan metrik per kelas tercatat.
- [ ] Tidak ada klaim food safety, penyakit, atau kandungan kimia dari foto.

## Release repository
- [ ] `frontend/node_modules/` tidak di-commit.
- [ ] `frontend/.next/` tidak di-commit.
- [ ] `.venv/` tidak di-commit.
- [ ] Dataset mentah/prepared tidak di-commit.
- [ ] `.env` lokal tidak di-commit.
- [ ] Tidak ada backup, patch folder, atau file revisi sementara.
- [ ] Jalankan `npm run typecheck` dan `npm run build` sebelum push final.
