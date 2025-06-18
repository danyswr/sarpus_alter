# Google Apps Script Setup Guide

## Langkah-langkah Setup

### 1. Buka Google Apps Script
1. Pergi ke https://script.google.com
2. Klik "New Project"

### 2. Ganti Kode Default
1. Hapus semua kode yang ada di file `Code.gs`
2. Copy semua kode dari file `Code.gs` di project ini
3. Paste ke Google Apps Script editor

### 3. Deploy sebagai Web App
1. Klik "Deploy" > "New deployment"
2. Pilih type: "Web app"
3. Description: "Mahasiswa Feedback Platform API"
4. Execute as: "Me (your-email@gmail.com)"
5. Who has access: "Anyone"
6. Klik "Deploy"
7. Copy URL yang diberikan

### 4. Update URL di Project
1. Ganti URL di file `server/routes.ts` line 6:
   ```typescript
   const GOOGLE_SCRIPT_URL = "URL_BARU_DARI_DEPLOYMENT";
   ```

### 5. Setup Spreadsheet
Pastikan spreadsheet memiliki struktur seperti ini:

#### Sheet "Users":
```
idUsers | username | email | password | role | nim | jurusan | gender | bio | location | website | createdAt
```

#### Sheet "Posting":
```
idPostingan | idUsers | judul | deskripsi | imageUrl | timestamp | likeCount | dislikeCount
```

### 6. Test Connection
Setelah deployment, test dengan:
```bash
curl "YOUR_DEPLOYED_URL?action=test"
```

### 7. Troubleshooting
- Pastikan spreadsheet dapat diakses oleh script
- Pastikan deployment menggunakan "Execute as: Me"
- Pastikan "Who has access: Anyone"
- Check logs di Google Apps Script dengan View > Logs

## Data Test
Untuk testing, pastikan ada data user di spreadsheet:
```
USER_1750169 | test5 | test5@gmail.com | 123123123 | user | 12345 | Akuntansi | Male | | | | 
```