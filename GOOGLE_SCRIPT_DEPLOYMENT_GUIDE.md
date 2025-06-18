# Google Apps Script Deployment Guide

## PENTING: Platform sudah siap, tinggal deploy Google Apps Script!

### Masalah saat ini:
❌ Google Apps Script URL tidak valid atau belum di-deploy dengan benar
✅ Website sudah mendukung semua fitur termasuk komentar
✅ Struktur data sudah sesuai dengan kode.gs Anda

### Langkah-langkah deployment:

1. **Buka Google Apps Script:**
   - Pergi ke https://script.google.com
   - Buka project Google Apps Script Anda
   - Pastikan ada file Code.gs dengan kode yang sudah saya update

2. **Copy kode terbaru:**
   - Gunakan kode dari file `Code.gs` yang sudah saya update
   - Kode ini sudah include semua fitur: login, register, posts, likes, comments, upload gambar

3. **Deploy sebagai Web App:**
   - Klik tombol "Deploy" di pojok kanan atas
   - Pilih "New deployment"
   - Type: pilih "Web app"
   - Execute as: **Me (email Anda)**
   - Who has access: **Anyone** 
   - Klik "Deploy"

4. **Copy URL yang benar:**
   - Setelah deploy, akan muncul URL seperti:
   ```
   https://script.google.com/macros/s/[SCRIPT_ID]/exec
   ```
   - Copy URL ini

5. **Update di website:**
   - Beri tahu saya URL yang benar
   - Saya akan update website untuk menggunakan URL tersebut

### Features yang akan aktif setelah deploy:
✅ Login/Register users ke spreadsheet
✅ Posting dengan gambar ke Google Drive  
✅ Like/dislike system
✅ **Comment system** - komentar akan masuk ke sheet "Comments"
✅ Admin dashboard dengan stats real-time
✅ Update post tanpa duplikat
✅ Timestamp preservation

### Test setelah deploy:
1. Login dengan user yang ada di spreadsheet
2. Buat post baru
3. Coba like/dislike  
4. **Test comment system** - klik "Komentar" dan tambah komentar
5. Check spreadsheet - komentar harus masuk ke sheet "Comments"

Tolong deploy Google Apps Script dengan langkah di atas, lalu beri URL yang benar!