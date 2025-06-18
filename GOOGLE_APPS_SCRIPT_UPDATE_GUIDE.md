# PANDUAN UPDATE GOOGLE APPS SCRIPT

## Masalah Yang Terjadi
- Fitur comment dan like/dislike tidak berfungsi karena Google Apps Script menggunakan versi lama
- Error "Post ID, User ID, dan komentar harus diisi" menunjukkan parsing data POST tidak bekerja
- Like/dislike tidak tersimpan ke spreadsheet Google Sheets

## Langkah-Langkah Perbaikan

### 1. Update Google Apps Script
1. Buka Google Apps Script di: https://script.google.com
2. Cari project "Mahasiswa Feedback Platform"
3. Hapus semua code yang ada di file `Code.gs`
4. Copy seluruh isi file `Code.gs` yang sudah saya buat di project ini
5. Paste ke Google Apps Script editor
6. Save (Ctrl+S)

### 2. Deploy Ulang Web App
1. Klik "Deploy" → "New deployment"
2. Pilih type: "Web app"
3. Execute as: "Me"
4. Who has access: "Anyone"
5. Klik "Deploy"
6. Copy URL baru (jika berubah)

### 3. Update URL di Project (Jika Perlu)
Jika URL berubah, update di `server/routes.ts`:
```typescript
const GOOGLE_SCRIPT_URL = "URL_BARU_DARI_GOOGLE_APPS_SCRIPT";
```

### 4. Test Fitur
Setelah update, test:
- Login/Register: ✅ (sudah bekerja)
- Posting: ✅ (sudah bekerja)
- Like/Dislike: akan bekerja setelah update
- Comment: akan bekerja setelah update
- Upload Image: ✅ (sudah bekerja)

## Fitur Yang Akan Bekerja Setelah Update

### Comment System
- Membuat comment baru
- Menampilkan semua comment per post
- Menghapus comment (owner only)
- Username otomatis dari data user

### Like/Dislike System
- Like/dislike post dengan spam prevention
- Toggle like/dislike (bisa ganti dari like ke dislike)
- Data tersimpan ke sheet "UserInteractions"
- Counter like/dislike terupdate otomatis

### Data Structure Google Sheets
Setelah update akan ada 4 sheets:
1. **Users**: Data pengguna
2. **Posting**: Data postingan dengan like/dislike count
3. **UserInteractions**: Track like/dislike per user per post
4. **Comments**: Data komentar per post

## Verification
Setelah update Google Apps Script, test dengan:
```bash
curl -X POST "GOOGLE_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

Harus return:
```json
{
  "message": "Connection successful",
  "status": "ok",
  "methods_supported": ["GET", "POST"],
  "cors_enabled": true
}
```