# API Documentation Specification

> **WAJIB:** Semua isi dokumentasi (nilai teks di JSON) ditulis dalam **Bahasa Indonesia** dan dapat dipahami pembaca non-teknis. Key JSON tetap memakai nama dari schema.
>
> Contoh lengkap yang lolos validasi: `spec/example-api-document.json`. Aturan visual DOCX ada di `spec/DOCX_RENDERING_SPEC.md` dan hanya relevan untuk maintainer renderer.

## Bahasa dan pembaca

Dokumen dapat dibaca oleh orang dengan latar belakang teknis maupun non-teknis. Usahakan dampak dan arti bisnis mudah ditemukan, tanpa menghilangkan identifier teknis yang dibutuhkan sebagai referensi.

Pertahankan identifier teknis seperti nama class, method, field, endpoint, environment variable, HTTP method, nama library, dan potongan source code dalam bentuk aslinya bila memang membantu penelusuran. Istilah teknis umum boleh dipertahankan jika lebih tepat, tetapi setiap istilah harus diberi konteks Bahasa Indonesia pada kemunculan pertamanya.

Untuk request field, bila relevan, tambahkan:

- nama yang lebih mudah dipahami selain identifier source
- apakah field wajib diisi
- jenis nilai dalam bahasa sederhana
- aturan pengisian dan arti field bagi proses bisnis bila informasinya tersedia

Detail implementasi seperti decorator, annotation, dan tipe source boleh ditampilkan bila membantu menjelaskan behavior, risiko, atau alasan sebuah kesimpulan. Jangan menganggap keberadaan detail teknis sebagai masalah dengan sendirinya; gunakan penilaian berdasarkan konteks source.

## Tujuan

Analisis endpoint backend dan hasilkan dokumentasi API yang faktual, ringkas, dan siap dipakai tim engineering.

Source dapat berupa NestJS, Node.js, Go, atau .NET, termasuk controller, route, service, DTO, repository, entity, database operation, validasi, dan HTTP client.

Source code adalah satu-satunya sumber fakta. Jangan mengisi detail yang tidak ditemukan.

## Alur kerja

1. Terima file atau folder source dan identifikasi endpoint yang diminta.
2. Tentukan root aplikasi, bukan folder feature atau module: ancestor terdekat dari target yang memiliki manifest project (`package.json`, `go.mod`, `*.csproj`, `*.sln`, `Cargo.toml`) dan tidak berada di luar root git. Jika tidak ada manifest, gunakan root git. Pada monorepo, hasilnya adalah folder aplikasi (mis. `apps/api`), bukan root monorepo.
3. Ikuti import dan dependency langsung yang dibutuhkan endpoint tersebut.
4. Jika target adalah proxy/gateway, ikuti kontrak downstream yang tersedia dalam scope bila diperlukan untuk memahami behavior.
5. Buat `<PROJECT_ROOT>/docs/<target-name>.json` sesuai schema.
6. Validasi JSON.
7. Render JSON menjadi `<PROJECT_ROOT>/docs/<target-name>.docx`.
8. Pastikan file DOCX ada dan tidak kosong.

Abaikan `node_modules`, build output, generated files, vendor, coverage, dan source yang tidak terkait endpoint.

## Aturan fakta

- Bedakan fakta implementasi, risiko, dan rekomendasi.
- Catat path file dan simbol sumber bila tersedia.
- Jangan menyimpulkan authentication, status code, transaction, retry, atau constraint tanpa bukti di source.
- Jika sesuatu tidak ditemukan, boleh beri konteks tentang batas fakta agar pembaca tidak salah menafsirkan hasilnya.
- Bedakan informasi yang tidak ditemukan, tidak berlaku, atau belum dapat dipastikan bila perbedaannya penting bagi pembaca.
- Jangan menambahkan placeholder hanya untuk memenuhi schema. Array kosong boleh digunakan jika memang tidak ada behavior yang ditemukan.
- Ulangi istilah yang sama secara konsisten. Jangan mengganti nama service, field, atau operation hanya untuk variasi gaya.
- Usahakan setiap section menjawab `apa artinya bagi pengguna atau proses bisnis`, bukan hanya daftar class, method, decorator, atau library. Informasi teknis tetap boleh ditampilkan bila menjadi bukti atau membantu menjelaskan behavior.

## Struktur dokumen

Dokumen terdiri dari cover page dan sembilan section. Cover page memakai Word section terpisah; section konten mengalir secara compact tanpa page break paksa agar tidak menghasilkan area kosong.

### Cover page

Tampilkan:

- `API DOCUMENTATION`
- nama service
- method, URL, dan nama function
- tabel metadata: document name, endpoint, service, version, date, author, status, classification
- `CONFIDENTIAL — Internal Engineering Use Only`

### 1. Endpoint overview

Tampilkan tabel:

- HTTP method
- URL
- controller atau route
- service method
- authentication
- content type
- success response code

Tampilkan tabel request DTO:

- nama parameter dan nama yang lebih mudah dipahami
- jenis data dalam bahasa sederhana
- wajib atau opsional
- aturan pengisian dalam bahasa manusia
- business meaning atau arti parameter bagi proses bisnis
- bukti source sebagai referensi teknis terpisah

### 2. Business process

Jelaskan langkah proses sesuai urutan source. Untuk setiap langkah jelaskan tindakan, alasan bisnis yang dapat dibuktikan, arti langkah bagi pengguna, dan hasil jika langkah gagal. Jangan menulis `Controller memanggil service` tanpa menjelaskan apa yang diminta pengguna dan data apa yang dihasilkan.

Jika ada beberapa aturan validasi, gunakan tabel `Rule | Failure condition | Error | Business effect`.

Jika ada dua atau lebih write operation tanpa transaction wrapper, tandai sebagai risiko red (lihat tabel severity di Section 7).

### 3. System interaction

Tampilkan:

1. service, environment variable, role, dan tipe internal atau external
2. pseudo-sequence diagram di code block
3. arah komunikasi `From | To | Operation | Purpose`

Bedakan operasi concurrent dari sequential. Tandai dependency antar operasi.

### 4. Database operations

Pisahkan:

- READ: table, operation, lookup key, business purpose
- WRITE: operation summary dan field detail
- snapshot atau audit fields yang digunakan

Gunakan callout info untuk snapshot atau audit field yang penting.

### 5. External API integration

Buat satu tabel untuk setiap external HTTP call:

`Endpoint | Query parameters | Execution order | Business purpose | Fields used | Failure effect`

Jika call kedua bergantung pada hasil call pertama, tandai dependency tersebut dan gunakan callout red bila kegagalan dapat memutus proses utama.

### 6. Error handling

Section ini hanya berisi behavior yang benar-benar ditangani source saat ini.

#### 6.1 Business rule validation

Tabel: `Handled condition | Error message | Source location | HTTP response`.

Masukkan hanya error eksplisit yang menghasilkan respons 4xx, misalnya NestJS `throw new BadRequestException(...)`, Go `http.Error(w, msg, http.StatusBadRequest)`, atau .NET `return NotFound(...)`.

#### 6.2 Fallback values

Tabel: `Condition | Mechanism | Fallback value | Process effect`.

Masukkan hanya ternary, default value, nullish fallback, atau conditional fallback yang benar-benar ada.

#### 6.3 General error propagation

Tabel: `Mechanism | Behavior | Scope`.

Dokumentasikan `catch`, rethrow, wrapper exception, dan propagation behavior yang ada.

Akhiri section dengan catatan bahwa behavior yang belum ditangani dianalisis di Section 7.

### 7. Risk analysis

Analisis risiko arsitektur, bukan daftar error hipotetis. Setiap risiko memiliki tiga poin:

- Skenario konkret
- Trigger spesifik
- Dampak bisnis

Severity:

| Type    | Gunakan untuk                                                                    |
| ------- | -------------------------------------------------------------------------------- |
| `red`   | no atomic transaction, unprotected null access, write race condition             |
| `amber` | external cascade failure, missing schema validation, missing database constraint |
| `info`  | snapshot gap, observability gap, minor maintainability issue                     |

### 8. Improvement recommendations

Buat minimal satu rekomendasi dan hingga lima atau lebih bila didukung bukti source; jangan menambah rekomendasi generik hanya untuk mencapai jumlah tertentu. Urutkan dari paling kritis (`priority` 1 = paling kritis). Setiap rekomendasi berisi masalah saat ini, solusi konkret, dan contoh code bila membantu.

Evaluasi topik berikut berdasarkan bukti source:

- atomic transaction
- null check
- database unique constraint
- retry dan circuit breaker
- structured logging
- response schema validation
- event-driven architecture atau caching

Gunakan callout purple untuk perubahan arsitektur tingkat tinggi.

### 9. Response structure

Tampilkan:

1. success response dalam JSON code block
2. tabel response field: `Field | Type | Description`
3. tabel error response: `HTTP status | Condition | Example message`
4. panduan untuk frontend atau mobile client

Error response harus berasal dari Section 6 dan risiko 500 yang masuk akal dari Section 7. Tandai mana yang faktual dan mana yang potensial.

## JSON contract

File `<PROJECT_ROOT>/docs/<target-name>.json` wajib memiliki bentuk dasar berikut:

```json
{
  "metadata": {},
  "endpoint": {},
  "sections": {
    "overview": {},
    "businessProcess": {},
    "systemInteraction": {},
    "database": {},
    "externalApis": [],
    "errorHandling": {},
    "risks": [],
    "recommendations": [],
    "response": {}
  }
}
```

Gunakan `schema/api-document.schema.json` untuk validasi struktur minimum. Gunakan nama folder target sebagai `<target-name>`; untuk target berupa file, gunakan nama file tanpa ekstensi. Satu file JSON berisi tepat satu endpoint; jika semua endpoint dalam target didokumentasikan, buat satu file per endpoint dengan nama `<target-name>-<handler>`. `PROJECT_ROOT` adalah root aplikasi/repository, bukan folder `src/modules/...` tempat source berada.
### Metadata

Metadata tidak berasal dari source, jadi gunakan nilai default berikut kecuali pengguna memberi nilai lain:

| Field            | Nilai                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `documentName`   | `Dokumentasi API <METHOD> <url>`                                      |
| `service`        | nama aplikasi dari manifest (`name` di `package.json`, module di `go.mod`, nama project `.csproj`) |
| `version`        | `1.0`                                                                 |
| `date`           | tanggal hari ini, format `YYYY-MM-DD`                                 |
| `author`         | hasil `git config user.name`; jika kosong, `Tidak diketahui`          |
| `status`         | `Draft`                                                               |
| `classification` | `Internal`                                                            |

### Nilai yang tidak ditemukan

Field wajib yang tidak dapat diisi dari source ditulis sebagai kalimat faktual, bukan `null` atau placeholder, misalnya `Tidak ada (endpoint tidak menerima query)` untuk `queryDto` atau `Tidak ditemukan pengecekan autentikasi di source yang dianalisis` untuk `auth`. Untuk daftar yang memang kosong, gunakan array kosong.

## Section 6 boundary

Section 6 documents only implemented behavior:

- explicit 4xx errors (e.g. `BadRequestException`, `http.Error(..., 400)`, `return NotFound()`) belong in 6.1
- ternary or default fallback belongs in 6.2
- catch and rethrow behavior belongs in 6.3
- missing handling belongs in Section 7
