# Panduan Deployment ke Vercel - Platform Mahasiswa Feedback

## Persiapan Deployment

### 1. Setup Repository di GitHub
```bash
# Inisialisasi git repository (jika belum ada)
git init
git add .
git commit -m "Initial commit - Platform Mahasiswa Feedback"

# Push ke GitHub
git remote add origin https://github.com/username/mahasiswa-feedback-platform.git
git branch -M main
git push -u origin main
```

### 2. Konfigurasi Environment Variables
Setelah deploy ke Vercel, tambahkan environment variables berikut:

**Required Variables:**
- `NODE_ENV` = `production`
- `SESSION_SECRET` = `mahasiswa-feedback-secret-key-2024` (atau buat secret key yang lebih kuat)
- `GOOGLE_SHEETS_API_URL` = `https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec`

**Optional Variables:**
- `GOOGLE_DRIVE_FOLDER_ID` = `1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw`

### 3. Deployment Steps

1. **Login ke Vercel Dashboard**
   - Buka https://vercel.com
   - Login dengan GitHub account

2. **Import Project**
   - Klik "New Project"
   - Pilih repository GitHub Anda
   - Framework akan otomatis terdeteksi sebagai "Other"

3. **Configure Build Settings**
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Install Command: `npm install`

4. **Deploy**
   - Klik "Deploy"
   - Tunggu proses build selesai

### 4. Post-Deployment Configuration

#### Update CORS Origins
Setelah mendapat URL Vercel (misal: `https://mahasiswa-feedback-xyz.vercel.app`), update konfigurasi CORS di:

1. **Google Apps Script** (jika diperlukan)
   - Buka Google Apps Script editor
   - Update CORS headers untuk menerima domain Vercel

2. **Client API Configuration**
   - URL API akan otomatis menggunakan domain yang sama

### 5. Testing Deployment

Setelah deployment sukses, test fitur-fitur berikut:

- ✅ Login/Register
- ✅ Dashboard dan Create Post
- ✅ Like/Unlike posts
- ✅ Profile management
- ✅ Admin panel (jika user admin)
- ✅ Image upload ke Google Drive

### 6. Custom Domain (Optional)

Jika ingin menggunakan domain custom:

1. Buka project di Vercel Dashboard
2. Masuk ke tab "Domains"
3. Tambahkan domain custom
4. Update DNS records sesuai instruksi Vercel

## Troubleshooting

### Error: "Function exceeded the time limit"
- Tambahkan timeout configuration di `vercel.json`
- Optimasi API calls ke Google Sheets

### Error: CORS Issues
- Pastikan CORS configuration di `vercel.json` sudah benar
- Update Google Apps Script untuk menerima domain Vercel

### Error: Session not working
- Pastikan `SESSION_SECRET` sudah di-set di environment variables
- Check cookie configuration untuk production

## File Structure untuk Deployment

```
project/
├── api/
│   └── index.ts          # Serverless function untuk API
├── client/
│   └── src/              # React frontend
├── server/
│   └── ...               # Server logic (akan di-bundle)
├── vercel.json           # Vercel configuration
├── package.json          # Dependencies
└── .env.example          # Environment variables template
```

## Important Notes

1. **Google Sheets Integration**: Tetap menggunakan Google Apps Script URL yang sudah ada
2. **Session Storage**: Menggunakan MemoryStore untuk production (bisa upgrade ke Redis jika diperlukan)
3. **File Uploads**: Google Drive integration tetap berfungsi
4. **Real-time Features**: WebSocket tidak didukung di Vercel, tapi polling tetap bisa digunakan

## Support

Jika ada masalah deployment, cek:
1. Vercel deployment logs
2. Browser console untuk error frontend
3. Network tab untuk API calls yang gagal