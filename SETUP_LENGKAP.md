# Panduan Setup Lengkap FeedbackU

Panduan ini akan membantu Anda mengintegrasikan website FeedbackU dengan Google Spreadsheet dan Google Drive.

## Langkah 1: Setup Google Spreadsheet

1. **Buka Google Sheets dan buat spreadsheet baru**
   - Beri nama "FeedbackU Database"
   - Salin ID spreadsheet dari URL (bagian antara `/d/` dan `/edit`)

2. **Buka Google Apps Script**
   - Kunjungi https://script.google.com
   - Klik "New Project"
   - Ganti nama project menjadi "FeedbackU Backend"

3. **Copy kode dari file Code.gs**
   - Hapus semua kode default
   - Copy paste seluruh isi file `Code.gs` dari project ini
   - Pastikan DRIVE_FOLDER_ID sudah sesuai: `1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw`

4. **Deploy sebagai Web App**
   - Klik "Deploy" > "New deployment"
   - Pilih type: "Web app"
   - Execute as: "Me"
   - Who has access: "Anyone"
   - Klik "Deploy"
   - Copy URL yang diberikan

## Langkah 2: Setup Database

1. **Jalankan fungsi setup**
   - Di Apps Script, pilih function `setupSpreadsheet` dari dropdown
   - Klik tombol "Run" (▶)
   - Berikan izin yang diminta

2. **Verifikasi setup**
   - Kembali ke Google Spreadsheet
   - Pastikan ada 2 sheet: "Users" dan "Posts"
   - Sheet Users harus memiliki data admin dan user contoh

## Langkah 3: Test Koneksi

1. **Test dengan browser**
   - Buka URL: `YOUR_SCRIPT_URL?action=test`
   - Harus mengembalikan response JSON dengan message "Connection successful"

2. **Test get data**
   - Buka URL: `YOUR_SCRIPT_URL?action=getPosts`
   - Harus mengembalikan array (mungkin kosong)

## Akun Default untuk Testing

**Admin:**
- Email: `admin@admin.admin`
- Password: `admin123`

**User Biasa:**
- Email: `user@student.com`  
- Password: `user123`

## Jika Ada Masalah

1. **Error 403 atau 401:**
   - Pastikan deployment di-set "Anyone" access
   - Re-deploy script jika ada perubahan

2. **CORS Error:**
   - Pastikan Apps Script sudah di-deploy sebagai web app
   - Cek apakah URL script benar

3. **Data tidak tersimpan:**
   - Cek execution logs di Apps Script
   - Pastikan spreadsheet permissions benar

## Script URL yang Sudah Dikonfigurasi

Website sudah dikonfigurasi untuk menggunakan URL:
`https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec`

Google Drive Folder:
`https://drive.google.com/drive/folders/1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw`

## Fitur yang Tersedia

1. **User Registration/Login** - Registrasi dan login dengan role-based access
2. **Post Creation** - Buat postingan dengan upload gambar
3. **Like/Dislike System** - Sistem like/dislike dengan tracking user
4. **Admin Dashboard** - Dashboard admin untuk melihat statistik dan moderasi
5. **Image Upload** - Upload gambar langsung ke Google Drive
6. **Responsive Design** - Design responsif untuk mobile dan desktop

## Struktur Database

**Sheet Users:**
- idUsers, username, email, password, nim, jurusan, role, createdAt

**Sheet Posts:**
- idPostingan, idUsers, judul, deskripsi, imageUrl, likes, dislikes, likedBy, dislikedBy, timestamp