# Maps App 2 - Perbaikan Submission Kedua

## 📋 Statement of Work (SOW)

### Status Kriteria

| Kriteria                                | Status              | Keterangan                                   |
| --------------------------------------- | ------------------- | -------------------------------------------- |
| 1. Mempertahankan Kriteria Submission 1 | ✅ Terpenuhi        | SPA, Marker Peta, Tambah Data, Aksesibilitas |
| 2. Push Notification                    | ❌ Perlu Diperbaiki | Lihat detail di bawah                        |
| 3. PWA (Instalasi & Offline)            | ✅ Terpenuhi        | Installable, offline app shell               |
| 4. IndexedDB                            | ❌ Perlu Diperbaiki | Lihat detail di bawah                        |

---

## 🔴 Kriteria 2: Push Notification - Masalah & Solusi

### Masalah dari Reviewer:

> "Notifikasi ketika diklik masih tetap tidak melakukan izin browser ataupun request ke endpoint backend Story API"

### Analisis Kode Saat Ini:

**Yang sudah benar:**

1. ✅ Endpoint API sudah benar: `${API_BASE}/notifications/subscribe` (line 1061)
2. ✅ Format payload sudah benar: `{ endpoint, keys: { p256dh, auth } }` (line 1068-1073)
3. ✅ Service Worker sudah diregistrasi tanpa kondisi production
4. ✅ Tombol toggle notifikasi sudah ada (`btnNotif`)
5. ✅ VAPID Public Key sudah benar

**Yang mungkin bermasalah:**

1. ⚠️ Tombol notifikasi mungkin tidak ter-render saat pertama kali load
2. ⚠️ Event listener mungkin tidak attach dengan benar saat navigasi SPA
3. ⚠️ Perlu memastikan flow: klik tombol → minta izin → subscribe → POST ke API

### Langkah Perbaikan:

#### Task 2.1: Verifikasi Flow Push Notification

- [ ] Pastikan tombol `#btnNotif` visible dan clickable
- [ ] Test: klik tombol → muncul dialog izin browser
- [ ] Test: setelah izin granted → POST ke `/notifications/subscribe`
- [ ] Cek Network tab: pastikan request terkirim dengan format benar

#### Task 2.2: Pastikan Service Worker Push Handler Berfungsi

- [ ] Buat cerita baru (trigger push dari server)
- [ ] Verifikasi notifikasi muncul
- [ ] Klik notifikasi → navigasi ke halaman yang sesuai

#### Task 2.3: Perbaikan Kode (jika diperlukan)

```javascript
// Pastikan kode ini dijalankan setelah DOM ready
// dan setelah Service Worker aktif
```

**File yang perlu dicek/edit:**

- `src/main.js` (line 1021-1143) - Push Notification logic
- `src/sw.js` (line 75-142) - Service Worker push & notification handlers

---

## 🔴 Kriteria 4: IndexedDB - Masalah & Solusi

### Masalah dari Reviewer:

> "IndexedDB saat ini digunakan sebagai cache untuk secara otomatis menyimpan story yang didapat dari proses fetch. Namun, pendekatan ini belum sepenuhnya sesuai dengan kriteria wajib nomor 4."
>
> "Sesuai ketentuan, penggunaan IndexedDB sebaiknya difokuskan untuk (create, read, dan delete) data berdasarkan izin atau aksi dari pengguna misalnya untuk fitur bookmark atau menyimpan story yang disukai."

### Analisis Kode Saat Ini:

**Yang sudah ada:**

1. ✅ Object Store `favorite-stories` untuk bookmark manual
2. ✅ Fungsi `simpanFavorite()`, `ambilSemuaFavorite()`, `hapusFavorite()`
3. ✅ Tombol "Simpan" di setiap item cerita
4. ✅ Halaman `/stories-saved` untuk melihat cerita tersimpan
5. ✅ Fitur hapus cerita dari halaman tersimpan

**Yang mungkin bermasalah:**

1. ⚠️ Halaman tersimpan mungkin kurang jelas/terlihat
2. ⚠️ Fitur bookmark mungkin belum terlihat jelas oleh reviewer
3. ⚠️ Perlu memastikan alur: User klik "Simpan" → Data masuk IndexedDB → User akses halaman "Tersimpan"

### Langkah Perbaikan:

#### Task 4.1: Verifikasi Fitur Bookmark Berfungsi

- [ ] Login ke aplikasi
- [ ] Di halaman Home, klik tombol "Simpan" pada salah satu cerita
- [ ] Cek IndexedDB (DevTools → Application → IndexedDB → mapsapp-db → favorite-stories)
- [ ] Navigasi ke halaman "Tersimpan" (menu navigasi)
- [ ] Verifikasi cerita muncul di halaman tersimpan

#### Task 4.2: Perbaikan UX (jika diperlukan)

- [ ] Pastikan tombol "Simpan" terlihat jelas
- [ ] Tambahkan feedback visual (toast notification) saat berhasil simpan
- [ ] Pastikan menu "Tersimpan" mudah ditemukan
- [ ] Tambahkan icon bookmark yang menarik

#### Task 4.3: Dokumentasi Fitur untuk Reviewer

Jelaskan di aplikasi atau catatan:

1. User harus LOGIN terlebih dahulu
2. User klik tombol "Simpan" pada cerita yang diinginkan
3. Cerita tersimpan di IndexedDB (bukan cache otomatis)
4. User bisa melihat daftar di halaman "Tersimpan" (menu navigasi)
5. User bisa HAPUS cerita dari halaman "Tersimpan"

**File yang perlu dicek/edit:**

- `src/main.js` - Fungsi IndexedDB dan UI bookmark
- `src/index.html` - Navigasi ke halaman tersimpan

---

## 📝 Checklist Perbaikan

### Push Notification (Kriteria 2)

- [ ] Klik tombol "Aktifkan Notifikasi" memunculkan dialog izin browser
- [ ] Setelah izin granted, aplikasi POST ke `/notifications/subscribe`
- [ ] Toggle button berubah menjadi "Matikan Notifikasi"
- [ ] Buat story baru → push notification muncul
- [ ] Klik notifikasi → navigasi ke halaman terkait

### IndexedDB (Kriteria 4)

- [ ] Tombol "Simpan" terlihat di setiap item cerita (Home)
- [ ] Klik "Simpan" → Toast muncul "Cerita disimpan!"
- [ ] Data masuk ke IndexedDB `favorite-stories`
- [ ] Halaman "Tersimpan" menampilkan cerita yang disimpan
- [ ] Tombol "Hapus" berfungsi
- [ ] Setelah hapus, data hilang dari IndexedDB

---

## 🧪 Testing Steps

### Test Push Notification:

1. Buka aplikasi di browser (bukan localhost jika perlu HTTPS)
2. Klik tombol "Aktifkan Notifikasi" di navbar
3. Allow notification permission
4. Cek Console: "Subscription berhasil dikirim"
5. Cek Network tab: POST ke `/notifications/subscribe` dengan status 2xx
6. Buat story baru (via form "Tambah Cerita")
7. Push notification akan muncul dari server

### Test IndexedDB Bookmark:

1. Login ke aplikasi
2. Buka DevTools → Application → IndexedDB
3. Di halaman Home, klik "Simpan" pada cerita
4. Cek IndexedDB → `favorite-stories` → data baru muncul
5. Klik menu "Tersimpan" di navbar
6. Cerita tampil di halaman tersimpan
7. Klik "Hapus" → Cerita hilang dari list dan IndexedDB

---

## 🔧 Kemungkinan Perbaikan Kode

### 1. Pastikan Push Button Listener Ter-Attach

Masalah: Event listener mungkin tidak ter-attach karena timing DOM.

```javascript
// Di main.js, pastikan listener dijalankan setelah DOM ready
document.addEventListener('DOMContentLoaded', () => {
  // ... kode push notification
});
```

### 2. Perbaiki Visibility Tombol Simpan

Pastikan tombol simpan terlihat jelas dan tidak tersembunyi:

```css
/* Di styles.css */
.btn-save {
  background: #10b981;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
}
```

### 3. Tambahkan Feedback yang Lebih Jelas

```javascript
// Setelah berhasil simpan
tampilkanToast('✅ Cerita berhasil disimpan ke halaman Tersimpan!', 'success');
```

---

## 📊 API Endpoints Reference

### Story API (Dicoding):

- Base URL: `https://story-api.dicoding.dev/v1`

### Push Notification:

- Subscribe: `POST /notifications/subscribe`

  - Body: `{ endpoint, keys: { p256dh, auth } }`
  - Headers: `Authorization: Bearer <token>`

- Unsubscribe: `DELETE /notifications/subscribe`
  - Body: `{ endpoint }`
  - Headers: `Authorization: Bearer <token>`

### VAPID Public Key:

```
BCCs2eonMI-6H2ctvFaWg-UYdDv387Vno_bzUzALpB442r2lCnsHmtrx8biyPi_E-1fSGABK_Qs_GlvPoJJqxbk
```

---

## 📌 Catatan Penting

1. **Push Notification memerlukan HTTPS** - Jika testing di localhost, pastikan gunakan `localhost` (exception dari browser) atau deploy ke hosting dengan HTTPS.

2. **IndexedDB berbasis USER ACTION** - Reviewer ingin memastikan bahwa data disimpan berdasarkan aksi user (klik tombol Simpan), BUKAN otomatis cache dari fetch.

3. **Halaman Tersimpan harus berbeda dari Saved/Offline Queue** - Pastikan ada pemisahan antara:
   - `/saved` = Antrian post offline
   - `/stories-saved` = Cerita yang di-bookmark user

---

## 📁 Struktur File

```
mapsapp2/
├── src/
│   ├── icons/
│   ├── index.html        # Entry point HTML
│   ├── main.js           # Logika aplikasi utama
│   ├── manifest.webmanifest
│   ├── styles.css        # Styling
│   └── sw.js             # Service Worker
├── dist/                 # Build output
├── package.json
├── webpack.config.js
└── README.md             # File ini
```

---

_Terakhir diperbarui: 29 Desember 2024_
