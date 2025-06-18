# UPDATE GOOGLE APPS SCRIPT - PENTING!

## Masalah yang Sudah Diperbaiki:
1. ✅ **Update Post Membuat Duplikat** - Sekarang update akan mengedit post yang ada, bukan membuat post baru
2. ✅ **Timestamp Berubah Saat Update** - Timestamp asli posting akan dipertahankan
3. ✅ **Fitur Komentar Lengkap** - Sistem komentar dengan sheet terpisah "Comments"
4. ✅ **Performance Optimization** - Response time lebih cepat

## Cara Update Google Apps Script:

### Langkah 1: Buka Google Apps Script
1. Buka Google Drive
2. Cari file Google Apps Script Anda
3. Klik kanan → Open with → Google Apps Script

### Langkah 2: Replace Semua Kode
1. Pilih semua kode yang ada (Ctrl+A)
2. Hapus semua kode lama
3. Copy paste kode dari file `optimized_google_script_final.js` atau `Code.gs`

### Langkah 3: Deploy Ulang
1. Klik tombol "Deploy" → "New deployment"
2. Pilih "Web app"
3. Execute as: **Me**
4. Who has access: **Anyone**
5. Klik "Deploy"
6. Copy URL yang baru dan update di server Anda

## Fitur Baru yang Tersedia:

### 1. Sistem Komentar
- Sheet "Comments" akan dibuat otomatis
- User dapat menambah, melihat, dan hapus komentar
- Admin dapat hapus semua komentar

### 2. Update Post yang Benar
- Tidak akan membuat duplikat lagi
- Timestamp asli dipertahankan
- Hanya konten yang berubah

### 3. Performance Optimization
- Response time lebih cepat
- User lookup menggunakan map untuk O(1) access
- Proper error handling

## Struktur Spreadsheet Final:

### Sheet "Users"
```
ID Users | Email | Username | Password | NIM | Gender | Jurusan | Role | TimeStamp
```

### Sheet "Posting"
```
idPostingan | idUsers | judul | deskripsi | imageUrl | timestamp | likeCount | dislikeCount
```

### Sheet "UserInteractions"
```
idPostingan | idUsers | interactionType | timestamp
```

### Sheet "Comments" (BARU!)
```
idComment | idPostingan | idUsers | comment | timestamp
```

## Testing Checklist:
- [ ] Login/Register berfungsi
- [ ] Buat post baru
- [ ] Update post (pastikan tidak ada duplikat)
- [ ] Like/dislike post
- [ ] Tambah komentar
- [ ] Hapus komentar
- [ ] Upload gambar

## Troubleshooting:
1. **Jika masih ada duplikat**: Pastikan menggunakan kode terbaru dan deploy ulang
2. **Jika komentar tidak muncul**: Pastikan sheet "Comments" sudah dibuat
3. **Jika error permissions**: Pastikan deploy dengan "Execute as: Me"

Silakan update Google Apps Script Anda dengan kode terbaru untuk mengatasi masalah duplikat post!