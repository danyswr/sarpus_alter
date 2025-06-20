# Panduan Perbaikan Username di Postingan

## Masalah
Postingan menampilkan "Unknown User" padahal seharusnya menampilkan username sebenarnya.

## Penyebab
Google Apps Script yang digunakan tidak mengirimkan data username dengan benar ke frontend.

## Solusi
1. **Update Google Apps Script** - Gunakan file `FIXED_USERNAME_google_script.js` yang telah dibuat
2. **Deploy ulang Google Apps Script** dengan kode baru
3. **Pastikan struktur spreadsheet sudah benar**

## Langkah-langkah Perbaikan

### 1. Copy Kode Google Apps Script Baru
Salin seluruh isi file `FIXED_USERNAME_google_script.js` ke Google Apps Script editor.

### 2. Ganti SPREADSHEET_ID
Pastikan variabel `SPREADSHEET_ID` di baris 13 sesuai dengan ID spreadsheet Anda:
```javascript
var SPREADSHEET_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";
```

### 3. Deploy Ulang
1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Copy URL baru dan update di backend jika perlu

### 4. Perbaikan Utama dalam Kode
- **Efficient Username Lookup**: Membuat map user ID ke username untuk lookup yang lebih cepat
- **Proper Username Return**: Mengembalikan username yang benar dengan setiap post
- **Fallback Handling**: Jika username tidak ditemukan, menampilkan "Unknown User"

### 5. Struktur Data yang Diperbaiki
Setiap post sekarang mengembalikan:
```javascript
{
  idPostingan: "POST_123",
  idUsers: "USER_123", 
  judul: "Judul Post",
  deskripsi: "Deskripsi post",
  username: "Username Sebenarnya", // <-- Ini yang diperbaiki
  timestamp: "2025-06-20T...",
  like: 0,
  dislike: 0
}
```

## Verifikasi
Setelah deploy, cek di browser developer tools bahwa API response menyertakan field `username` yang benar.