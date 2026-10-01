# Deploy RHIO dengan Docker Compose

Dua cara, image dan database-nya sama:

| Cara | File | HTTPS |
| --- | --- | --- |
| **Coolify** | `docker-compose.yml` | proxy Coolify (lihat COOLIFY-ID.md) |
| **VPS biasa** (Ubuntu, Debian, dll.) | `docker-compose.yml` + `docker-compose.standalone.yml` | Caddy, sertifikat otomatis |

App menolak start tanpa https (`APP_ORIGIN` wajib https), jadi selalu ada proxy TLS di depannya.
Database = SQLite (D1) di volume `rhio-data`. Jalankan **1 container saja**.

## 1. Siapkan server (VPS biasa)

- Docker Engine + plugin Compose (`docker compose version`).
- DNS: record A (dan AAAA kalau ada IPv6) domain kamu mengarah ke IP server.
- Port 80 dan 443 terbuka (Caddy butuh port 80 untuk mengambil sertifikat).

## 2. Isi `.env`

```sh
git clone <repo> rhio && cd rhio
cp .env.compose.example .env
```
Isi minimal:
- `RHIO_DOMAIN=rhio.studio` dan `APP_ORIGIN=https://rhio.studio` (sama, `APP_ORIGIN` pakai https://);
- `BETTER_AUTH_SECRET` dan `CLAIMS_ADMIN_TOKEN`: acak, 32+ karakter
  (`node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"`);
- `AI_API_KEY` (Gemini, paid tier untuk user sungguhan), `CHAIN_RPC_URL` (Alchemy), `TOPUP_TREASURY` (wallet atau Safe
  penyimpan USDG), `REWARD_ROOT_POSTER_KEY` nanti setelah vault ada (VAULT-MAINNET-ID.md Langkah 6).

`.env` tidak pernah masuk Git dan tidak pernah masuk image (`.dockerignore`). Container menolak start kalau ada nilai yang
salah format dan menuliskan alasannya di log.

## 3. Jalankan

```sh
docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d --build
docker compose -f docker-compose.yml -f docker-compose.standalone.yml logs -f rhio
```
Di log harus terlihat: migration diterapkan (`0015_free_refill.sql` dan seterusnya), `worker variables: ...`, lalu
`starting on 0.0.0.0:8787 for https://rhio.studio`. Healthcheck memanggil `/api/chain` tiap 30 detik; Caddy baru
menerima trafik setelah container sehat.

## 4. Cek setelah deploy

```sh
curl -s https://rhio.studio/api/chain | head -c 300
curl -s -X POST https://rhio.studio/api/ai/check -H "Authorization: Bearer $CLAIMS_ADMIN_TOKEN"
BASE=https://rhio.studio npm run smoke
```
`/api/ai/check` menjalankan satu tugas pendek ke Gemini dan menampilkan provider, model dan error asli kalau gagal.

## 5. Update, backup, rollback

- **Update:** `git pull && docker compose -f docker-compose.yml -f docker-compose.standalone.yml up -d --build`.
  Migration baru diterapkan otomatis saat start; data di volume tetap.
- **Backup:** salinan harian otomatis di `/data/backups` (simpan `RHIO_BACKUP_DAYS` hari). Salin juga ke luar server:
  ```sh
  docker run --rm -v rhio_rhio-data:/data -v "$PWD":/backup alpine tar czf /backup/rhio-data-$(date +%F).tgz -C /data .
  ```
  (nama volume: `docker volume ls`, biasanya `<nama-folder>_rhio-data`).
- **Rollback:** `git checkout <commit-sebelumnya>` lalu `up -d --build`. Migration bersifat additive, database lama tetap
  terbaca oleh versi sebelumnya.

## 6. Tes lokal (tanpa domain)

`.env` dengan `RHIO_DOMAIN=localhost`, `APP_ORIGIN=https://localhost:8443`, `HTTP_PORT=8080`, `HTTPS_PORT=8443`, lalu
buka https://localhost:8443 (sertifikat lokal Caddy, browser akan memperingatkan). Jangan pakai `.env` ini di server.
