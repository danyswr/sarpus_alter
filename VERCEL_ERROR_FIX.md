# Solusi Error Vercel Deployment

## Error: "functions property cannot be used with builds"

### Solusi 1: Deploy tanpa vercel.json
1. Rename `vercel.json` menjadi `vercel.json.backup`
2. Deploy langsung tanpa konfigurasi khusus
3. Vercel akan auto-detect sebagai Vite project

```bash
mv vercel.json vercel.json.backup
git add .
git commit -m "Remove vercel.json for deployment"
git push
```

### Solusi 2: Gunakan konfigurasi sederhana
Ganti isi `vercel.json` dengan:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": "dist"
}
```

### Solusi 3: Deploy frontend only
Untuk deployment cepat, deploy hanya frontend:

1. **Settings di Vercel Dashboard:**
   - Framework: Vite
   - Build Command: `vite build`
   - Output Directory: `dist`
   - Root Directory: `./`

2. **Environment Variables:**
   ```
   VITE_API_URL=https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec
   ```

### Solusi 4: Split deployment
Deploy frontend dan backend terpisah:

**Frontend (Vercel):**
- Deploy folder `client` sebagai project terpisah
- Framework: Vite
- Build Command: `npm run build`

**Backend (tetap di Replit atau VPS):**
- Keep server running di Replit
- Update CORS untuk domain Vercel

### Quick Fix
Coba langkah ini untuk fix cepat:

1. Hapus `vercel.json` sementara
2. Deploy dari Vercel dashboard
3. Pilih framework "Vite"
4. Set Build Command: `vite build`
5. Set Output Directory: `dist`

## Update Frontend untuk Production

Update file `client/src/lib/api.ts` untuk production:

```typescript
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://your-api-endpoint.com'
  : 'http://localhost:5000'
```

Atau langsung gunakan Google Sheets API:

```typescript
const API_BASE_URL = 'https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec'
```