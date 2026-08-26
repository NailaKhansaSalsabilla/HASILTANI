# Supabase lokal

HASILTANI tetap menyiapkan komponen Supabase sesuai konsep: Auth + PostgreSQL + Storage.

Supabase lokal membutuhkan **Docker Desktop** dan Supabase CLI. Dari root project:

```bash
npx supabase init
npx supabase start
npx supabase db reset
```

Salin URL dan anon key dari output `npx supabase status` ke `frontend/.env.local`.

> Local demo mode pada frontend tetap tersedia supaya seluruh alur tiga role dapat diuji sebelum Supabase selesai dikonfigurasi. Untuk integration test nyata, set `NEXT_PUBLIC_DATA_MODE=supabase` dan gunakan Supabase lokal.

Admin tidak dapat dibuat lewat public signup. Buat user admin melalui Supabase Studio lokal, lalu ubah `profiles.role` menjadi `admin` melalui SQL editor untuk testing.
