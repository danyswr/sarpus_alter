# Setup Deployment Vercel - Platform Mahasiswa Feedback

## Langkah 1: Persiapan Repository

### Push ke GitHub
```bash
git init
git add .
git commit -m "Platform Mahasiswa Feedback - Ready for deployment"
git branch -M main
git remote add origin https://github.com/USERNAME/mahasiswa-feedback.git
git push -u origin main
```

## Langkah 2: Deploy ke Vercel

### Import Project di Vercel
1. Login ke https://vercel.com
2. Klik "New Project"
3. Pilih repository GitHub Anda
4. Framework: **Vite**
5. Build Command: `vite build`
6. Output Directory: `dist`
7. Install Command: `npm install`
8. Root Directory: `.` (default)

**PENTING**: Jika ada error "functions property cannot be used with builds", hapus sementara `vercel.json` dan deploy tanpa konfigurasi khusus terlebih dahulu.

### Environment Variables
Tambahkan di Vercel Dashboard > Settings > Environment Variables:

```
NODE_ENV=production
SESSION_SECRET=mahasiswa-feedback-secret-2024
GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec
```

## Langkah 3: Konfigurasi Google Apps Script

Update Google Apps Script untuk CORS Vercel:

1. Buka Google Apps Script editor
2. Tambahkan domain Vercel ke CORS headers:

```javascript
// Di function doOptions atau handleRequest
const allowedOrigins = [
  'https://your-app-name.vercel.app',
  'https://*.vercel.app'
];
```

## Langkah 4: Test Deployment

Fitur yang harus ditest:
- Login/Register
- Dashboard posting
- Like/dislike posts
- Profile edit
- Admin panel (jika admin)
- Upload gambar

## Troubleshooting

### Build Fails
- Check package.json dependencies
- Ensure all imports menggunakan relative paths

### API Errors
- Verify environment variables di Vercel
- Check Google Sheets API URL masih aktif

### CORS Issues
- Update Google Apps Script CORS settings
- Check domain di Vercel matches CORS config

## Files yang Sudah Disiapkan

✅ `vercel.json` - Konfigurasi deployment
✅ `.env.example` - Template environment variables  
✅ `DEPLOYMENT_GUIDE.md` - Panduan lengkap
✅ Project structure sudah sesuai untuk Vercel

## URL Setelah Deploy

Format URL: `https://mahasiswa-feedback-[random].vercel.app`

Bisa setup custom domain di Vercel Dashboard > Domains.