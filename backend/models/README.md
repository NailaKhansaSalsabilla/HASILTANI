# HASILTANI model directory — Hierarchical Quality Q1

Inference aktif menggunakan lima pasangan file:

- `spoilage.pt` + `spoilage.json` — shared fresh/rotten guard
- `pisang_stage.pt` + `pisang_stage.json`
- `mangga_stage.pt` + `mangga_stage.json`
- `jeruk_stage.pt` + `jeruk_stage.json`
- `tomat_stage.pt` + `tomat_stage.json`

Empat stage model hanya mempelajari `unripe / ripe / overripe`.
Kelas `rotten` ditangani terpisah oleh spoilage guard agar kerusakan tidak diperlakukan sebagai sekadar tahap kematangan berikutnya.

Output final API tetap satu dari empat kondisi canonical:
`unripe / ripe / overripe / rotten`.

Model lama `pisang.pt`, `mangga.pt`, `jeruk.pt`, `tomat.pt` tidak dibaca oleh inference Q1.
