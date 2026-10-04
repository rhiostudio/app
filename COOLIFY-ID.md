# Deploy ke Coolify (Docker Compose): preview.rhio.studio

Panduan ini untuk **preview** di `preview.<domain utama>`, contohnya `preview.rhio.studio`. Kalau domain utamamu lain, ganti `rhio.studio` di semua langkah.

Production nanti memakai cara yang sama, hanya domain, secret dan volume-nya yang berbeda (lihat bagian akhir).

## Cara kerjanya
- App ini adalah Cloudflare Worker + D1. Di Coolify, Worker dijalankan oleh **workerd** (runtime open-source Cloudflare) lewat `wrangler dev --local`. Database D1 berupa file SQLite di volume `rhio-data` (`/data`).
- Saat container start, `scripts/container-start.mjs` akan:
  1. Menolak konfigurasi berbahaya: secret kosong, `AUTH_TRUST_SITES_HEADERS` bernilai true, atau domain non-https. Untuk mainnet juga: token harus USDG resmi, treasury wajib, dan finality tidak boleh `soft`.
  2. Meneruskan **hanya** env var yang ada di daftar izin ke Worker.
  3. Menjalankan migration yang belum pernah jalan (0000–0009). Migration dicatat di tabel `d1_migrations`, jadi tidak dijalankan ulang.
  4. Kalau domain diawali `preview.`, otomatis masuk mode **noindex**: `robots.txt` diisi `Disallow: /` dan header `X-Robots-Tag: noindex` ikut dikirim, supaya preview tidak muncul di Google.
- Setelah start, proses yang sama juga:
  - memanggil **scheduler** tiap menit (`/api/schedules/tick`) untuk menjalankan jadwal agent dan menyinkronkan pencatat holder. Token-nya dibuat otomatis tiap start, jadi tidak perlu Scheduled Task Coolify;
  - membuat **backup database harian** di `/data/backups/rhio-YYYY-MM-DD.sqlite`. Jumlah yang disimpan diatur `RHIO_BACKUP_DAYS` (default 7).
- Karena database-nya SQLite di satu volume, jalankan **1 container saja**. Jangan di-scale ke beberapa replika.

### Kenapa tidak ada service database di docker-compose?
- Database-nya **D1**, yaitu SQLite yang berjalan di dalam runtime Worker (workerd) di container `rhio` itu sendiri. Filenya ada di volume `rhio-data`:
  - data: `/data/v3/d1/miniflare-D1DatabaseObject/<hash>.sqlite`
  - backup: `/data/backups/`
- Tidak perlu Postgres atau MySQL, tidak ada password database, dan tidak ada port database yang terbuka. Semua tabel dibuat oleh migration `drizzle/*.sql` saat start.
- Kode yang sama juga bisa di-deploy ke Cloudflare Workers + D1 managed (DEPLOY-ID.md) tanpa perubahan.
- Batasannya: satu container, dan database tidak dipakai bersama server lain. Kalau nanti traffic sudah besar, ada dua pilihan:
  - pindah ke Cloudflare D1 managed (paling mudah, kodenya sama);
  - port ke Postgres (butuh ubah lapisan database).

## 1. Push ke Git
Coolify mengambil kode dari repository Git (GitHub, GitLab, Gitea, dan sejenisnya). Folder ini belum berupa repo Git.
```bash
git init
git add .
git status
```
Sebelum commit, pastikan file-file ini **tidak** muncul di daftar (semuanya sudah ada di `.gitignore`):
- `.dev.vars`
- `deploy.config.json`
- `.wrangler/`
- `node_modules/`
- `dist/`

```bash
git commit -m "RHIO: Coolify docker compose"
git branch -M main
git remote add origin git@github.com:<akun>/<repo>.git
git push -u origin main
```
Repo boleh private. Di Coolify, hubungkan lewat GitHub App atau Deploy Key.

## 2. DNS
Di pengelola DNS `rhio.studio` (misalnya Cloudflare), tambahkan record:

| Type | Name | Value |
| --- | --- | --- |
| A | preview | IP server Coolify |

Kalau memakai Cloudflare, set dulu ke **DNS only** (awan abu-abu) supaya Coolify bisa membuat sertifikat Let's Encrypt. Setelah HTTPS jalan, boleh diubah ke Proxied dengan SSL mode **Full (strict)**.

## 3. Buat resource di Coolify
1. Project → **+ New** → **Private Repository** (atau Public) → pilih repo dan branch `main`.
2. **Build Pack: Docker Compose**, dengan Docker Compose Location `/docker-compose.yml`.
3. Di pengaturan service **rhio**, isi Domains dengan `https://preview.rhio.studio:8787`.
   `:8787` hanya memberi tahu proxy Coolify port container-nya. Pengunjung tetap membuka `https://preview.rhio.studio` tanpa port.
4. Isi tab **Environment Variables**:

| Variabel | Isi untuk preview |
| --- | --- |
| `APP_ORIGIN` | `https://preview.rhio.studio` (wajib, tanpa `/` di akhir) |
| `BETTER_AUTH_SECRET` | 32+ karakter acak, **berbeda** dari production (wajib) |
| `CHAIN_NETWORK` | `testnet` |

Cara membuat secret acak:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64url'))"
```
Semua variabel lain boleh dibiarkan kosong. Fitur chain (top-up, klaim, tier) tetap **OFF** sampai alamat testnet diisi.

Untuk menyalakan fitur chain di preview:
1. Jalankan `npm run deploy:testnet` (lihat DEPLOY-ID.md bagian 7).
2. Tempel baris env yang dicetak script itu ke Coolify: `PAY_TOKEN_ADDRESS`, `TOPUP_TREASURY`, `CLAIMS_CONTRACT`, `CLAIMS_ADMIN_TOKEN`, `RHIO_TOKEN_ADDRESS`, dan seterusnya.
3. Redeploy.

Di preview token-nya bernama **tUSDG / tRHIO** (token tiruan di testnet, tanpa nilai).

**Jangan pernah** mengisi `AUTH_TRUST_SITES_HEADERS=true` atau `RHIO_ALLOW_DEV_FLAGS=true` di server. Container akan menolak start kalau ada.

5. Klik **Deploy**. Build pertama makan waktu sekitar 3–6 menit (`npm ci` + `vinext build`).

## 4. Cek setelah deploy
```bash
curl -s https://preview.rhio.studio/api/chain
curl -s https://preview.rhio.studio/robots.txt
```
- Perintah pertama harus mengembalikan JSON berisi `"chainId":46630`.
- Perintah kedua harus berisi `Disallow: /`.
- Buka situsnya, lalu **Sign in → Wallet** (tanda tangan saja, gratis). Setelah itu simpan sebuah agent.
- Di log container harus terlihat baris `[rhio] preview mode: ...` dan `Ready on http://0.0.0.0:8787`.

## 4b. Mainnet (Robinhood Chain 4663)
Pakai isi `.env.coolify.mainnet` (file lokal, di-ignore Git). Isinya:
- `CHAIN_NETWORK=mainnet`
- `PAY_TOKEN_ADDRESS` = USDG resmi `0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168`
- finality `safe`
- klaim dan tier **OFF**

Sebelum deploy:
- **`TOPUP_TREASURY` wajib diisi** dengan alamat multisig kamu. Tanpa itu container menolak start.
- Isi `CHAIN_RPC_URL` dengan RPC provider (misalnya Alchemy), karena RPC publik mainnet dibatasi rate-limit.

Container juga menolak token selain USDG resmi dan menolak finality `soft`. Di halaman Wallet muncul peringatan **"Mainnet · real funds"**.

`SKILL_TRIAL_LIMIT=2` = tiap akun bisa mencoba tiap skill 2x; `0` (default kalau dikosongkan) = tanpa batas, credit dan batas harian yang menentukan.

Holder rewards: `REWARDS_ENABLED=false` sampai token RHIO, token reward dan RhioClaims kedua ada. Cara menyalakan dan
alur operatornya ada di DEPLOY-ID.md bagian 7 dan GO-LIVE-RHIO-ID.md. Pencatat holder jalan otomatis dari scheduler di dalam
container. Kalau perlu memicunya sendiri (Coolify → Terminal), perintahnya:
`node -e "fetch('http://127.0.0.1:8787/api/rewards/admin',{method:'POST',headers:{Authorization:'Bearer '+process.env.CLAIMS_ADMIN_TOKEN,Origin:process.env.APP_ORIGIN},body:JSON.stringify({action:'sync'})}).then(r=>r.text()).then(console.log)"`

## 4b-2. Jadwal agent dan NVDA reward
- **Jadwal agent** aktif otomatis. Batasnya bisa diatur lewat env:
  - `SCHEDULE_RUN_COST`: kredit per run, default 5;
  - `SCHEDULE_MAX`: jumlah jadwal per akun, default 3;
  - `SCHEDULE_DAILY_RUNS`: run terjadwal per akun per hari, default 24.
  - Matikan dengan `SCHEDULES_ENABLED=false`.
- **Kirim hasil jadwal ke Discord / Telegram** (halaman Schedules → Delivery):
  - Discord langsung aktif: user menempel alamat webhook channel-nya sendiri. Matikan dengan `NOTIFY_DISCORD=false`.
  - Telegram aktif setelah `TELEGRAM_BOT_TOKEN` diisi. Buat bot di @BotFather (`/newbot`), salin tokennya langsung ke
    Environment Variables Coolify (jangan ditempel di chat mana pun), lalu redeploy. Bot itu jangan dipasangi webhook di
    tempat lain: server membaca pesannya sendiri (getUpdates). Tanpa token, panel menulis "not set up on this server yet".
  - `NOTIFY_MAX`: jumlah channel per akun, default 4.
  - **Agen menjawab di Telegram** memakai bot yang sama, tanpa env baru. Container menjalankan pembaca pesan sendiri
    (long poll), jadi jawaban mulai dalam satu-dua detik. Biarkan privacy mode bot tetap aktif (bawaan BotFather):
    di grup hanya `/ask …` yang sampai ke bot. Tiap jawaban adalah run live biasa yang memotong kredit pemilik chat.
- **NVDA reward**: `.env.coolify.mainnet` sudah memakai `REWARD_TOKEN_ADDRESS` = NVDA Stock Token resmi. Ada tiga syarat supaya periode reward bisa jalan:
  1. token RHIO sudah ada (`RHIO_TOKEN_ADDRESS`);
  2. kontrak reward sudah di-deploy (`REWARD_CONTRACT`, lihat DEPLOY-ID.md bagian 7);
  3. `REWARDS_ENABLED=true`.
  - Sebelum klaim pertama, tiap holder mengisi negara domisili dan pernyataan kelayakan. US dan negara yang dibatasi ditolak.

## 4b-3. Menambah CA token RHIO
Cukup lewat env, tanpa mengubah kode. Di Coolify isi `RHIO_TOKEN_ADDRESS` dengan alamat kontrak di Robinhood Chain
mainnet (salin dari explorer supaya huruf besar-kecilnya benar), lalu **Redeploy**. Setelah itu:
- kotak **CA** di halaman depan menampilkan alamatnya, dengan tautan ke explorer dan tombol Copy;
- teks status di halaman depan dan menu berganti dari "not live" ke "The RHIO token is live";
- holder tier aktif: diskon fee dan jatah kredit bulanan (`TIER_BASE_CREDITS`) dibaca dari saldo RHIO wallet yang ditautkan.

Alamat hanya tampil kalau `CHAIN_NETWORK=mainnet`. Situs testnet menulis "Testnet build" dan tidak menampilkan alamat.
Kalau kotak CA masih "Not deployed yet" setelah redeploy, alamatnya salah ketik: `GET /api/chain` harus menampilkan
`rhioToken` berisi alamat itu.

Reward NVDA tidak ikut menyala: `REWARDS_ENABLED` tetap `false` sampai syarat di 4b-2 terpenuhi. Whitepaper (bagian
token, masih "draft") dan roadmap (Phase 3) adalah teks, bukan env: ubah di `lib/rhio3d/src/content.js` saat token diluncurkan.

## 4c. Tes end-to-end setelah deploy
```bash
BASE=https://preview.rhio.studio npm run smoke
```
Yang dites:
- semua route publik dan dashboard, redirect login, 404 dan header keamanan;
- sign-in wallet, simpan agent, jalankan workflow sample, batas percobaan skill (2x per skill, ke-3 ditolak 429);
- publish ke Discover lalu unpublish, History dan kredit, endpoint wallet, tier dan klaim;
- logout.

Tes memakai wallet sekali pakai (tanpa dana) dan mengarsipkan agent QA di akhir.

## 5. Update, backup, rollback
- **Update:** push ke `main`, lalu Deploy di Coolify (atau aktifkan Auto Deploy). Migration baru jalan otomatis.
- **Backup database:** file SQLite ada di volume `rhio-data`, di bawah `/data/v3/d1/`. Contoh backup dari server:
```bash
docker run --rm -v <nama-volume-rhio-data>:/data -v $PWD:/backup alpine tar czf /backup/rhio-data-$(date +%F).tgz -C /data .
```
  Nama volume bisa dilihat di Coolify pada tab Storages, atau dengan `docker volume ls`.
- Backup harian otomatis ada di dalam volume yang sama (`/data/backups`). Salin juga secara rutin ke luar server, misalnya dengan perintah `tar` di atas dari cron host, atau dengan fitur backup Coolify. Kalau volume rusak, backup yang ada di dalam volume ikut hilang.
- **Restore:** stop container, salin `rhio-YYYY-MM-DD.sqlite` menimpa file `<hash>.sqlite` di `/data/v3/d1/miniflare-D1DatabaseObject/`, hapus file `-wal`/`-shm` di sebelahnya, lalu start lagi.
- **Rollback kode:** pilih deployment sebelumnya di Coolify. Migration tidak di-rollback, karena semuanya hanya menambah tabel.

## 6. Production nanti (rhio.studio)
Buat **resource terpisah** dari repo yang sama:
- Domain `https://rhio.studio:8787`
- `APP_ORIGIN=https://rhio.studio`
- `BETTER_AUTH_SECRET` baru
- Volume sendiri (dibuat otomatis per resource)

Mode noindex otomatis mati karena domainnya tidak diawali `preview.`. Kalau perlu, bisa dipaksa dengan `RHIO_NOINDEX=true` atau `false`.

Alternatif production tetap Cloudflare Workers + D1 asli (DEPLOY-ID.md).

## 7. Keamanan server
App ini menyimpan saldo credit dan (nanti) menentukan siapa boleh klaim reward. Siapa pun yang bisa masuk ke server atau
panel Coolify bisa membaca semua secret dan mengubah database, jadi server-nya dijaga seperti dompet:
- **Panel Coolify hanya lewat HTTPS** dengan domain sendiri (Settings → Instance domain), lalu tutup port `8000`, `6001`
  dan `6002` dari internet di firewall. Login panel lewat HTTP biasa mengirim password dan semua env tanpa enkripsi.
- **SSH dengan kunci saja:** `PasswordAuthentication no` dan `PermitRootLogin prohibit-password` di
  `/etc/ssh/sshd_config`, lalu `systemctl restart ssh`. Pastikan kunci SSH kamu sudah terpasang sebelum mematikan password.
- Firewall: hanya `22`, `80` dan `443` yang terbuka. Aplikasi lain di server yang sama berbagi risiko yang sama.
- Aktifkan 2FA di akun Coolify, GitHub, registrar domain dan penyedia server.
- Container berjalan tanpa hak tambahan (`no-new-privileges`, `cap_drop: ALL`). Proxy depannya membuang header identitas
  dan `cf-*` dari luar, menolak body di atas 1 MB, dan menutup `/cdn-cgi/*`. `RHIO_TRUST_CF_HEADERS` biarkan kosong
  kecuali domain memang lewat proxy Cloudflare dan server tidak bisa dijangkau langsung.
- Secret yang pernah tampil di chat, tangkapan layar atau perangkat yang kena malware dianggap bocor. Ganti dari
  perangkat yang bersih: `BETTER_AUTH_SECRET` (semua user login ulang), `CLAIMS_ADMIN_TOKEN`, key AI, key RPC.
- Salin `/data/backups` ke luar server secara rutin (bagian 5).

## Masalah umum
- **Live AI gagal dengan `internal error; reference = …`:** koneksi HTTPS keluar dari workerd gagal.
  - Image sekarang memasang `ca-certificates`, jadi cukup redeploy dengan build baru (jangan pakai cache image lama).
  - Cek dengan `curl -X POST https://<domain>/api/ai/check -H "Authorization: Bearer $CLAIMS_ADMIN_TOKEN"`. Bagian `network` di hasilnya membandingkan HTTP dan HTTPS:
    - HTTP gagal juga: masalahnya DNS atau jaringan server.
    - Hanya HTTPS yang gagal: masalahnya sertifikat.
| Gejala | Penyebab |
| --- | --- |
| Container langsung berhenti dengan pesan `[rhio] ...` | Pesannya menyebut env var yang salah atau kosong. |
| Semua tombol simpan membalas "Please use this workspace…" (403) | `APP_ORIGIN` tidak sama persis dengan URL di browser (cek https, www, dan `/` di akhir). |
| Bad Gateway | Domain di Coolify belum diberi `:8787`, atau container belum sehat (tunggu sekitar 60 detik setelah start). |
| "No browser wallet found" | Di desktop, pasang extension (MetaMask, Rabby). Di HP, buka situs lewat browser di aplikasi Robinhood Wallet. |
