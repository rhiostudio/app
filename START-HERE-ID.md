# RHIO Agent Studio: mulai di sini

Panduan menjalankan dan menguji project di komputer sendiri. Untuk deploy baca `DEPLOY-ID.md` (Cloudflare) atau
`COOLIFY-ID.md` (Docker Compose).

## Isi repo
Source website, lockfile, model dan gambar karakter, logo RHIO, database migrations, test scripts dan contoh
environment.

Tidak ada di repo: `node_modules`, cache, kunci/API secrets, database lokal, data akun pengguna, dan kredensial
deployment. Dependencies di-install ulang dengan `npm ci`.

## Menjalankan lokal
Butuh Node.js >=22.13.0 dan npm. Buka terminal di folder yang berisi package.json.

```sh
npm ci
npm run build
```

Untuk database lokal BARU, jalankan semua migration di folder `drizzle/` sekali, berurutan menurut nomornya
(0000 sampai yang terbaru; database lama cukup menjalankan migration yang belum pernah dijalankan):

```sh
for f in drizzle/0*.sql; do node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file "$f"; done
cp .dev.vars.example .dev.vars
# isi BETTER_AUTH_SECRET di .dev.vars (32+ karakter acak, perintahnya ada di file itu)
npm run dev
```

Buka http://localhost:5173 lalu **Connect wallet** dengan wallet extension (MetaMask/Rabby). Login hanya lewat
wallet (SIWE untuk Robinhood Chain). Di lokal, chain default-nya testnet 46630. Untuk deploy ke rhio.studio baca DEPLOY-ID.md. Jangan jalankan migration lagi ke database yang sudah diinisialisasi.
Website ini memakai backend Worker + D1; bukan HTML yang bisa dibuka lewat double-click.

Pengecekan:
```sh
npx tsc --noEmit --incremental false
npm run build
```

Menjalankan build yang menyerupai produksi (build asli + proxy depan + migration dari nol), tanpa Docker:
```sh
npm run build
RHIO_ALLOW_DEV_FLAGS=true APP_ORIGIN=http://localhost:8790 PORT=8790 RHIO_DATA_DIR=.wrangler/qa-data BETTER_AUTH_SECRET=<32+ karakter acak> node scripts/container-start.mjs
```
Lalu buka http://localhost:8790. Semua fitur chain otomatis OFF selama variabel `CHAIN_*` tidak diisi.
