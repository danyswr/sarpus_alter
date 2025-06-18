# Setup Lengkap Platform Feedback Mahasiswa

## Deskripsi Sistem
Platform ini adalah website untuk keluh kesah mahasiswa yang terintegrasi dengan Google Spreadsheet sebagai database dan Google Drive untuk penyimpanan gambar.

## Arsitektur Sistem
- **Frontend**: React + TypeScript dengan Tailwind CSS
- **Backend**: Express.js sebagai proxy ke Google Apps Script
- **Database**: Google Spreadsheet 
- **Storage**: Google Drive untuk gambar
- **Authentication**: Role-based (user/admin)

## Google Apps Script Setup

### 1. Buat Google Apps Script Baru
1. Buka [Google Apps Script](https://script.google.com)
2. Klik "New Project"
3. Ganti nama project menjadi "Student Feedback Platform"

### 2. Replace Code.gs
Salin semua kode dari file `Code.gs` di project ini ke Google Apps Script

### 3. Update Configuration
Di file Code.gs, update folder ID:
```javascript
const GOOGLE_DRIVE_FOLDER_ID = "1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw";
```

### 4. Deploy sebagai Web App
1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Execute as: "Me" 
4. Who has access: "Anyone"
5. Klik "Deploy"
6. Copy URL deployment

### 5. Update URL di Project
Update URL di file `server/routes.ts`:
```javascript
const GOOGLE_SCRIPT_URL = "URL_DEPLOYMENT_ANDA_DISINI";
```

## Google Spreadsheet Setup

### 1. Struktur Database
Buat spreadsheet dengan 2 sheet:

#### Sheet "Users"
Kolom: `ID Users | Email | Username | Password | NIM | Gender | Jurusan | Role | TimeStamp`

#### Sheet "Posting"  
Kolom: `ID Users | ID Postingan | timestamp | Judul | Deskripsi | Like | Dislike`

### 2. Bind Spreadsheet ke Apps Script
1. Di Google Apps Script, klik "Resources" > "Libraries"
2. Enable Google Sheets API
3. Bind spreadsheet dengan script

## Google Drive Setup

### 1. Buat Folder untuk Images
1. Buat folder di Google Drive
2. Set sharing ke "Anyone with link can view"
3. Copy folder ID dari URL
4. Update di Code.gs

## Testing

### 1. Test Google Apps Script
```bash
curl -X POST "URL_DEPLOYMENT_ANDA" \
  -H "Content-Type: application/json" \
  -d '{"action":"test"}'
```

### 2. Test Login
```bash
curl -X POST "http://localhost:5000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123"}'
```

## Data Sample untuk Testing

### Sample Users (masukkan ke sheet "Users"):
```
USER1750000001 | admin@admin.com | admin | admin123 | 12345678 | Male | Teknik Informatika | admin | 2025-01-08T10:00:00.000Z
USER1750000002 | user@student.com | student1 | user123 | 87654321 | Female | Sistem Informasi | user | 2025-01-08T10:01:00.000Z
```

### Sample Posts (masukkan ke sheet "Posting"):
```
USER1750000002 | POST1750000001 | 2025-01-08T10:02:00.000Z | Keluhan Fasilitas | Perpustakaan kurang nyaman untuk belajar | 5 | 1
USER1750000002 | POST1750000002 | 2025-01-08T10:03:00.000Z | Saran Perbaikan | Mohon tambahkan AC di ruang kelas | 8 | 0
```

## Fitur Utama

### User Features:
- Login/Register
- Create posts (keluh kesah)
- Like/dislike posts
- View semua posts
- Edit profile

### Admin Features:
- Semua fitur user
- View statistics
- Lihat posts dengan like terbanyak
- Dashboard admin

## Troubleshooting

### Error: "Failed to fetch"
- Pastikan Google Apps Script sudah di-deploy
- Cek CORS settings di Google Apps Script
- Pastikan URL deployment benar

### Error: "Password salah"
- Cek data di spreadsheet "Users"
- Pastikan password sesuai
- Cek case-sensitivity

### Error: "Sheet tidak ditemukan"
- Pastikan nama sheet "Users" dan "Posting" exact
- Bind spreadsheet ke Apps Script
- Cek permissions spreadsheet

## Security Notes

- Password disimpan dalam plain text (untuk demo)
- Untuk production, gunakan hashing
- Set proper permissions di Google Drive
- Monitor Google Apps Script quotas

## Deployment ke Production

1. Build project: `npm run build`
2. Deploy ke Replit: klik "Deploy"
3. Set environment variables jika diperlukan
4. Test semua endpoints setelah deployment

## Support

Jika ada masalah:
1. Cek Google Apps Script logs
2. Cek browser console untuk errors
3. Test API endpoints secara manual
4. Pastikan semua permissions sudah benar