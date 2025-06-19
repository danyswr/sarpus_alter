# Google Apps Script Fix Guide

## Masalah Utama
Error: `response.getHeaders is not a function` pada line 42

## Solusi Cepat
Google Apps Script yang Anda gunakan masih menggunakan syntax lama `response.getHeaders()` yang tidak didukung.

## Langkah Perbaikan

### 1. Buka Google Apps Script
- Kunjungi: https://script.google.com/
- Buka project yang terhubung dengan URL ini: https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec

### 2. Ganti Kode yang Error
Cari baris yang menggunakan `response.getHeaders()` dan ganti dengan:

**DARI:**
```javascript
response.getHeaders()['Access-Control-Allow-Origin'] = '*';
```

**MENJADI:**  
```javascript
// Hapus baris response.getHeaders() sepenuhnya
// Headers sudah diset dengan ContentService
```

### 3. Perbaikan Lengkap untuk CORS
Ganti semua function yang menggunakan `response.getHeaders()` dengan struktur ini:

```javascript
function doOptions(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  // Hapus semua response.getHeaders() calls
  response.setContent(JSON.stringify({ 
    status: "ok",
    message: "CORS preflight successful"
  }));
  return response;
}

function handleRequest(e) {
  var response = ContentService.createTextOutput();
  response.setMimeType(ContentService.MimeType.JSON);
  
  // Hapus semua response.getHeaders() calls
  // Headers CORS akan dihandle otomatis oleh Google Apps Script
  
  try {
    // ... rest of your code
    response.setContent(JSON.stringify(result));
    return response;
  } catch (error) {
    var errorResponse = ContentService.createTextOutput();
    errorResponse.setMimeType(ContentService.MimeType.JSON);
    errorResponse.setContent(JSON.stringify({ 
      error: "Server error: " + error.toString()
    }));
    return errorResponse;
  }
}
```

### 4. Deploy Ulang
- Klik "Deploy" > "New deployment"  
- Pilih type: "Web app"
- Execute as: "Me"
- Who has access: "Anyone"
- Klik "Deploy"

## Status Backend
✅ Backend sudah siap dan akan berfungsi setelah Google Apps Script diperbaiki
✅ Error handling sudah diimplementasi untuk mendeteksi masalah GAS
✅ Semua endpoint telah disesuaikan dengan struktur GAS terbaru

## Test Setelah Perbaikan
Setelah update Google Apps Script, test dengan:
```bash
curl -X POST "http://localhost:5000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@gmail.com","username":"test","password":"123456"}'
```