# API Documentation Specification

> **WAJIB:** Semua isi dokumentasi (nilai teks di JSON) ditulis dalam **Bahasa Indonesia** yang sederhana sehingga pembaca non-teknis paham. Key JSON tetap memakai nama dari schema.
>
> Contoh lengkap yang lolos validasi: `spec/example-api-document.json`. Aturan visual DOCX ada di `spec/DOCX_RENDERING_SPEC.md` dan hanya relevan untuk maintainer renderer.

## Tujuan

Dokumen menjawab empat pertanyaan untuk setiap endpoint:

1. **Apa yang harus dikirim?** Parameter path, parameter query, dan isi body (DTO/payload).
2. **Apa yang dikembalikan?** Bentuk response sukses dan kemungkinan gagal.
3. **Data apa yang dibaca atau diubah?** Query ke database dan tabelnya.
4. **Bagaimana data saling terhubung?** Relasi antar tabel, termasuk antar service.

Hal di luar itu (analisis risiko, rekomendasi perbaikan, diagram arsitektur) tidak dimasukkan.

## Bahasa

- Tulis kalimat pendek dengan kata sehari-hari. Hindari istilah seperti "controller memanggil service"; jelaskan apa yang terjadi bagi pengguna.
- Identifier teknis (nama field, tabel, class, env var, HTTP method) tetap ditulis asli dengan backtick bila perlu, tetapi selalu didampingi penjelasan.
- Jenis isi field memakai kata sehari-hari: `Teks`, `Angka`, `Angka bulat`, `Ya/Tidak`, `Tanggal`, `Tanggal dan jam`, `Daftar`, `Objek`. Tambahkan format bila penting, misalnya `Teks (UUID)`, `Teks, pilihan: A, B, C`, atau `Angka bulat, 1 sampai 100`.
- Gunakan istilah yang sama secara konsisten di seluruh dokumen.
- **Dokumen hanya berisi fakta tentang API, bukan tentang proses analisis.** Jangan menulis cara pemetaan env var ke repo ditentukan, repo atau file yang tidak dibuka/ditelusuri, nilai env atau file `.env` yang tidak diperiksa, maupun temuan sampingan seperti bug atau ketidakcocokan format. Hal seperti itu cukup disampaikan di laporan chat.

## Microservice dan penelusuran lintas repo

Dokumen ditulis dari sudut pandang **client service target** (service yang path-nya diberikan pengguna).

- Jika endpoint meneruskan request ke service lain (mis. `${SVC_REPO_PROJECT_B}/api/v1/foo`), buka repo service tersebut untuk mengambil DTO, response, query, dan relasi tabel yang sebenarnya.
- Penelusuran hanya **satu tingkat**: panggilan dari repo B ke repo C dicatat di `downstream`, tetapi kodenya tidak dibuka.
- Nama service selalu nama folder repo yang sebenarnya. Untuk service tingkat kedua, cari foldernya dengan pemetaan nama yang sama (tanpa membuka kode); jika tidak ada folder yang cocok, tulis nama env var apa adanya. Jangan mengarang nama service.
- Setiap query dan relasi diberi nama service pemiliknya supaya pembaca tahu data itu tersimpan di mana.
- Jika repo tujuan tidak tersedia, dokumentasikan dari sisi pemanggil saja (URL, data yang dikirim, field yang dipakai).

## Struktur dokumen

Dokumen terdiri dari cover page, lalu satu bab per endpoint.

### Cover page

Berisi metadata, tabel **service yang terlibat** (`services`), dan daftar endpoint.

### Per endpoint

| Bagian | Isi | Key JSON |
| --- | --- | --- |
| Ringkasan | 1–3 kalimat tentang kegunaan endpoint bagi pengguna, method, URL, alias, perlu login atau tidak, dan lokasi kode | `title`, `summary`, `method`, `url`, `aliases`, `auth`, `handler` |
| Alur singkat | 3–7 langkah dalam bahasa awam sesuai urutan di source, termasuk kapan service lain dipanggil | `flow` |
| Data yang dikirim | Format data, DTO, parameter path, parameter query, isi body, dan contoh request | `request` |
| Service lain yang dipanggil | Panggilan HTTP ke service lain, tujuannya, dan lokasi handler di service tujuan | `downstream` |
| Data di database | Query yang dijalankan dan relasi antar tabel | `database` |
| Bentuk response | Status sukses, contoh response, penjelasan field, dan kemungkinan gagal | `response` |

## Aturan per bagian

### `title` dan `summary`

`title` adalah nama fungsi dalam bahasa awam (mis. `Lihat daftar pesanan`), bukan nama method. `summary` menjelaskan kegunaan endpoint dan, jika relevan, bahwa data sebenarnya diolah di service lain.

### `request`

- `contentType`: mis. `application/json`, `multipart/form-data`, atau `Tidak ada body (hanya parameter query)`.
- `dto`: nama class/struct DTO beserta path file. Jika service target meneruskan data apa adanya, sebutkan DTO di service tujuan dan jelaskan hal itu.
- `pathParams`, `queryParams`, `body`: setiap field berisi:
  - `name`: identifier asli. Field bertingkat ditulis dengan titik (`address.city`) dan field dalam daftar dengan `[]` (`items[].productId`).
  - `label`: nama yang mudah dipahami.
  - `type`: jenis isi dalam kata sehari-hari.
  - `required`: `true` jika wajib.
  - `description`: aturan pengisian (dari decorator validasi, binding tag, atau data annotation), nilai default jika tidak diisi, dan arti field bagi proses bisnis.
- `example`: contoh request (objek JSON untuk body, string untuk URL dengan query), atau `null` jika tidak relevan.

### `downstream`

Satu baris untuk setiap panggilan HTTP ke service lain, termasuk panggilan tingkat kedua yang ditemukan di service tujuan.

- `call`: method dan URL seperti ditulis di source, mis. `GET ${SVC_REPO_PROJECT_B}/api/v1/orders`.
- `purpose`: data apa yang diminta atau dikirim dan untuk apa.
- `handler`: file dan simbol handler di service tujuan, atau `-` untuk panggilan tingkat kedua dan repo yang tidak tersedia.

### `database`

- `queries`: satu baris per operasi database.
  - `operation`: `Baca`, `Tambah`, `Ubah`, atau `Hapus`.
  - `filter`: kondisi pencarian, urutan, batas/paging, atau kolom yang diisi/diubah, dalam bahasa awam dengan nama kolom asli.
  - `purpose`: alasan bisnis query tersebut.
- `relations`: relasi antar tabel yang dipakai endpoint.
  - `from` dan `to`: `tabel.kolom (service)`.
  - `kind`: `Satu ke satu`, `Satu ke banyak`, `Banyak ke satu`, `Banyak ke banyak (lewat tabel_x)`, atau `Referensi lewat API/ID, tanpa foreign key` untuk relasi lintas service.
  - `meaning`: arti relasi dalam kalimat sehari-hari, termasuk konsekuensinya bila penting (mis. data di service lain bisa sudah terhapus).

Sumber relasi: definisi entity/model (`@ManyToOne`, `@OneToMany`, `belongsTo`, tag GORM, navigation property EF), migration, atau join eksplisit di query. Jangan menebak relasi dari kemiripan nama kolom saja.

### `response`

- `status`: kode status sukses.
- `example`: contoh response sukses yang realistis sesuai struktur di source, atau `null` jika response kosong.
- `fields`: penjelasan setiap field, dengan notasi `name` yang sama seperti field request.
- `errors`: hanya respons gagal yang benar-benar ditangani di source (service target atau service tujuan yang diteruskan), termasuk 401/403 dari guard dan 400 dari validasi. Jelaskan di `condition` jika error berasal dari service tujuan.

## Metadata dan services

Metadata tidak berasal dari source, jadi gunakan nilai default berikut kecuali pengguna memberi nilai lain:

| Field            | Nilai                                                                 |
| ---------------- | --------------------------------------------------------------------- |
| `documentName`   | `Dokumentasi API <target-name>`                                       |
| `service`        | nama aplikasi dari manifest (`name` di `package.json`, module di `go.mod`, nama project `.csproj`) |
| `version`        | `1.0`                                                                 |
| `date`           | tanggal hari ini, format `YYYY-MM-DD`                                 |
| `author`         | hasil `git config user.name`; jika kosong, `Tidak diketahui`          |
| `status`         | `Draft`                                                               |
| `classification` | `Internal`                                                            |

`services` mencantumkan service target dan setiap service yang dipanggil: `name`, `repo` (nama folder repo, atau `-` jika tidak ada folder yang cocok), `envVar` (string kosong untuk service target), dan `role` (perannya dalam satu kalimat).

## Nilai yang tidak ditemukan

Field wajib yang tidak punya bukti di source ditulis sebagai fakta sederhana tentang API, bukan `null`, placeholder, atau komentar tentang analisis, misalnya `Tidak perlu login` untuk `auth` jika tidak ada guard. Untuk daftar yang memang kosong, gunakan array kosong; renderer akan menampilkan kalimat "tidak ada" yang sesuai.
