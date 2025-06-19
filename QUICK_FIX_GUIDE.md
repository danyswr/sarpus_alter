# QUICK FIX - Google Apps Script Error

## Error Yang Terjadi
```
TypeError: response.getHeaders is not a function (line 42, file "Kode")
```

## Solusi Cepat
1. Buka Google Apps Script: https://script.google.com
2. Pilih project "Mahasiswa Feedback Platform"
3. Hapus semua kode di file `Code.gs`
4. Copy semua kode dari file `FIXED_Code.gs` yang sudah saya buat
5. Paste ke Google Apps Script editor
6. Save (Ctrl+S)
7. Deploy ulang sebagai web app

## Perubahan Yang Diperbaiki
- Menghilangkan `response.getHeaders()` yang tidak didukung
- Memperbaiki struktur response CORS
- Menambahkan logging yang lebih baik
- Struktur action sesuai dengan backend yang sudah disesuaikan

## Test Setelah Update
Setelah deploy ulang, test dengan:
```bash
curl -X POST "YOUR_GOOGLE_SCRIPT_URL" \
  -H "Content-Type: application/json" \
  -d '{"action": "test"}'
```

Harus return JSON sukses, bukan HTML error.