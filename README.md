# Tentang
Proyek library terpisah

# Menjalankan monorepo (dari root)

Semua perintah dijalankan dari root `libs/` — tidak perlu `cd` ke folder package. Install cukup sekali di root. Task build dikelola **[Vite+](https://viteplus.dev)** (`vp run`, dengan cache), didefinisikan di `vite.config.ts` root.

| Perintah | Fungsi |
|---|---|
| `pnpm bootstrap` | pertama kali setelah clone: install semua + build semua library |
| `pnpm install` / `vp install` | install semua workspace (sekali, di root) |
| `pnpm dev` | build library (cache) lalu jalankan docs (VitePress) |
| `pnpm build` | build semua library berurutan: devextreme → utility → helper → utility, + data (= `vp run lib:all`) |
| `pnpm build:docs` | build docs (library dibuild dulu otomatis) (= `vp run site:build`) |
| `pnpm test` / `test:helper` / `test:utility` / `test:data` | jalankan test |
| `pnpm check` | cek file hasil generate (theme, basecoat, glyphs) + version.json |
| `pnpm clean` / `pnpm cache:clean` | hapus `dist/` semua library + cache Vite+ / hanya cache |

**Shortcut per package** — jalankan script atau perintah pnpm apa pun di satu package: `pnpm <package> <script>`:

```bash
pnpm helper build          # = pnpm --filter @mono-lit/helper build
pnpm helper theme:build
pnpm utility add -D zod    # tambah dependency ke @mono-lit/utility
pnpm site dev              # docs (package "docs"; nama "docs" dipakai pnpm sendiri)
```

Package: `helper`, `utility`, `devextreme`, `data`, `site`.

**Cache Vite+:** build yang input-nya tidak berubah langsung di-replay dari cache (`node_modules/.vite/task-cache`). Lihat detail run terakhir dengan `npx vp run --last-details`; paksa build ulang dengan `pnpm cache:clean`. Versi pnpm dikunci lewat `packageManager` (`pnpm@10.7.0`) supaya Vite+ memakai pnpm yang sama.

# npm Registry (internal)

Registry npm privat berjalan di **https://mono-libs.netlify.app/npm/** — VitePress docs + registry dalam satu site Netlify, storage **Netlify Blobs** (tanpa kartu kredit). Info ini internal (developer), tidak ada di docs publik.

## Konsumsi (project konsumen)

```ini
# .npmrc — hanya scope @mono-lit yang diarahkan ke registry kita
@mono-lit:registry=https://mono-libs.netlify.app/npm/
//mono-libs.netlify.app/npm/:_authToken=<REGISTRY_DOWNLOAD_TOKEN>
```

```bash
pnpm add @mono-lit/helper @mono-lit/utility @mono-lit/devextreme   # dari registry kita (Blobs)
pnpm add vue                                       # package publik → langsung dari registry.npmjs.org
```

Token download wajib untuk membaca package mono; token publish juga diterima. Package publik tetap terbuka.

| Package | Folder | Di registry? |
|---|---|---|
| `@mono-lit/helper` | `packages/helper` | ya |
| `@mono-lit/utility` | `packages/utility` | ya |
| `@mono-lit/devextreme` | `packages/devextreme` | ya |
| `@mono-lit/data` | `packages/data` | **tidak** (lokal saja) |

Nama lama (`mono-helper`, `mono-utils`, `mono-devextreme`) tidak dilayani lagi. Purge sisa versinya dari Blobs dengan `REGISTRY_PUBLISH_TOKEN=… pnpm registry:purge --yes` — **sebelum** registry yang hanya mengenal nama `@mono-lit/*` ter-deploy (setelah itu admin sync menolak nama lama).

## Arsitektur

```
mono-libs.netlify.app
│
├── /*       VitePress static docs (docs/)
│
├── /npm/@mono-lit/{helper,utility,devextreme} (+ ejaan %2f/%2F), /npm/-/*
│            netlify/functions/npm.ts  (Function v2, config.path = owned names only)
│            └── netlify/registry/handler.ts
│                  Blobs store "tarballs": <name>/<version>.tgz   (mis. @mono-lit/helper/0.0.1.tgz)
│                  Blobs store "metadata": <name>.json            (mis. @mono-lit/helper.json)
│                  site-scoped + strong consistency
│
└── /npm/*   everything else → 302 ke registry.npmjs.org, dijawab CDN edge
             (netlify.toml [[redirects]]). Tidak pernah memanggil function —
             penting untuk konsumen lama yang masih memakai registry= GLOBAL
             (dulu tiap package publik = 1 Lambda yang fetch npmjs live).
```

- `dist.shasum` (SHA-1) + `dist.integrity` (SHA-512 SRI) dihitung dari byte tarball persis (Web Crypto) di dalam function.
- URL tarball dibuat per-request dari host asli (jalan untuk netlify.app, custom domain, localhost).
- Download guard: read package mono butuh `Authorization: Bearer <REGISTRY_DOWNLOAD_TOKEN>` (dikirim otomatis npm/pnpm dari `.npmrc`). Publish token juga diterima (internal tooling).

## Kontrol versi via version.json

**`version.json`** (root repo) = *desired state* registry — setiap deploy menyamakan Blobs dengannya:

```json
{
  "@mono-lit/helper": ["!0.0.1"],
  "@mono-lit/utility": ["!0.0.1"],
  "@mono-lit/devextreme": ["!0.0.1"]
}
```

- **Tambah versi** → tambahkan di array + bump `package.json` package tsb → deploy mempublish; versi lama yang terdaftar tetap.
- **Hapus versi** → hapus dari array → deploy **purge** dari Blobs (tarball + metadata). `["0.0.1","0.0.2"] → ["0.0.3"]` = tersisa 0.0.3 saja.
- **Force re-release** → prefix `!`: `"!0.0.2"` purge 0.0.2 lalu republish kode saat ini dengan nomor yang sama — jalur memperbaiki kesalahan. Nomor tidak harus naik; rename balik ke `["0.0.1"]` boleh.
- Versi `package.json` yang tidak terdaftar di version.json → **deploy gagal**. Source berubah tapi versi sama & sudah terpublish → **deploy gagal** kecuali entry di-prefix `!`.

```text
edit version.json + package.json → git push → deploy sync registry otomatis
```

## Publish manual / cek

```powershell
$env:REGISTRY_PUBLISH_TOKEN="<secret>"     # sama dengan env var di Netlify
pnpm registry:publish    # purge sesuai version.json, lalu publish yang kurang
pnpm registry:check      # validasi lokal sebelum push
pnpm registry:verify     # e2e lokal penuh (publish/409/401/403/hash/install/import)
pnpm registry:dev        # registry lokal :8873 (in-memory, token "dev-token")
```

## Netlify setup (sudah berjalan)

- Site name `mono-libs`, build command & publish dir & functions dari `netlify.toml` (build packages → VitePress, `NODE_OPTIONS=--max-old-space-size=4096`).
- Env vars: `REGISTRY_PUBLISH_TOKEN` (publish + admin sync), `REGISTRY_DOWNLOAD_TOKEN` (guard download).
- Plugin `netlify/plugins/publish-registry`: **onPreBuild** validasi version.json + gitHead guard (production fail, preview warn), **onSuccess** auto-publish setelah deploy live.
- Penyebab "data hilang" dulu: fallback memory store terpakai di production — sekarang production SELALU pakai Blobs asli (memory hanya opt-in lokal).

## Catatan / limit

- Body request publish ~6 MB (@mono-lit/helper ~2 MB base64 — masih aman).
- Auth = satu shared download token + satu publish token (rotasi = ganti env var).
- Free plan: ~125k function calls/bulan, ~1 GB Blobs (~1.85 MB per full release, ~500+ release).
  Function call HANYA untuk 3 package mono + admin; package publik = redirect edge (gratis).
  pnpm mengikuti 302 lintas host dan MEMBUANG _authToken host ini (diverifikasi) — token tidak bocor ke npmjs.
- Upload besar kadang kena dropped connection — publish.mjs auto-retry 3x.
- Blobs UI (Data & Storage) = treat as read-only; menghapus store = menghapus registry.

## Instalasi (lama, via git token)
Untuk menginstall masing-masing library yang berada dalam folder [/packages](../main/packages) cukup dengan memasangnya di file `package.json` pada bagian `"dependencies"` misal. Sebelum menginstall library-library tersebut, generate terlebih dulu Github Classic Token, pada menu `https://github.com/settings/tokens`. simpan tokennya untuk digunakan dalam url library.


```bash
"nama_package": "git+https://<GITHUB_CLASSIC_TOKEN>@github.com/EJI-ICT/libs#path:/packages/nama_pacakge",
```


masing-masing library memiliki cara instalasi sendiri, silakan buka folder sesuai libray-nya, berikut daftar yang tersedia

- [formkit-bundle](../main/packages/formkit-bundle)
- [devextreme-bundle](../main/packages/devextreme-bundle)
- [formkit-auto](../main/packages/formkit-auto)
