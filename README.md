# Platform Mahasiswa Feedback

Platform feedback mahasiswa berbasis web untuk memberikan keluh kesah dan masukan dalam bentuk posting seperti Twitter. Sistem memiliki role-based access dengan user dan admin.

## 🚀 Features

- **Authentication System**: Login/Register dengan role management (user/admin)
- **Posting System**: Buat postingan keluh kesah dengan teks dan gambar
- **Interaction System**: Like/dislike posts dengan spam prevention
- **Profile Management**: Edit profil pengguna dengan pembatasan update
- **Admin Dashboard**: Statistik platform dan management user
- **Image Upload**: Upload gambar ke Google Drive
- **Real-time Updates**: WebSocket untuk update realtime
- **Search Function**: Cari user, post, dan konten

## 🛠 Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS + shadcn/ui
- TanStack Query (data fetching)
- Wouter (routing)
- Framer Motion (animations)

### Backend
- Express.js + TypeScript
- Session-based authentication
- WebSocket (ws)
- Google Sheets API (database)
- Google Drive API (file storage)

### Database & Storage
- Google Sheets (via Google Apps Script)
- Google Drive (image storage)
- MemoryStore (session storage)

## 📦 Installation & Development

### Prerequisites
- Node.js 18+
- npm atau yarn
- Google account (untuk Sheets & Drive access)

### Local Development
```bash
# Clone repository
git clone https://github.com/username/mahasiswa-feedback.git
cd mahasiswa-feedback

# Install dependencies
npm install

# Start development server
npm run dev
```

Server akan berjalan di `http://localhost:5000`

### Environment Variables
Copy `.env.example` ke `.env` dan isi:
```env
NODE_ENV=development
SESSION_SECRET=your-session-secret
GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 🚀 Deployment ke Vercel

### Quick Deploy
1. Push code ke GitHub
2. Connect repository ke Vercel
3. Set environment variables di Vercel Dashboard
4. Deploy!

Lihat [VERCEL_SETUP.md](./VERCEL_SETUP.md) untuk panduan lengkap.

### Environment Variables untuk Production
```env
NODE_ENV=production
SESSION_SECRET=strong-secret-key
GOOGLE_SHEETS_API_URL=https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec
```

## 📊 Database Schema

### Users Sheet
- idUsers, username, email, password, role, nim, jurusan, gender, bio, location, website, createdAt

### Posting Sheet  
- idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount

### UserInteractions Sheet
- idPostingan, idUsers, interactionType, timestamp

## 🔧 Configuration

### Google Apps Script Setup
1. Buat Google Spreadsheet baru
2. Buka Apps Script editor
3. Copy kode dari file `Code.gs` atau yang terbaru
4. Deploy sebagai web app
5. Copy URL dan masukkan ke environment variable

### Google Drive Setup
1. Buat folder di Google Drive
2. Share folder dengan email service account (jika menggunakan)
3. Copy folder ID untuk environment variable

## 🎯 Usage

### User Flow
1. Register akun baru atau login
2. Akses dashboard untuk melihat posts
3. Buat postingan baru dengan teks/gambar
4. Like/dislike posts dari user lain
5. Edit profil di halaman profile

### Admin Flow
1. Login dengan akun admin
2. Akses admin dashboard
3. Lihat statistik platform
4. Manage user dan posts
5. Delete posts yang melanggar aturan

## 🔒 Security Features

- Session-based authentication
- CSRF protection
- Input sanitization
- Role-based access control
- Secure cookie configuration
- CORS protection

## 📁 Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── lib/           # Utilities & API
│   │   └── hooks/         # Custom hooks
├── server/                # Express backend
│   ├── routes/           # API routes
│   ├── middleware/       # Auth & other middleware
│   └── googleSheetsStorage.ts # Google Sheets integration
├── shared/               # Shared types & schemas
└── vercel.json          # Vercel deployment config
```

## 🛡 API Endpoints

### Authentication
- `POST /api/login` - User login
- `POST /api/register` - User registration  
- `POST /api/logout` - User logout

### Posts
- `GET /api/posts` - Get all posts
- `POST /api/posts` - Create new post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/like` - Like/unlike post

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update profile

### Admin
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - User management

## 🧪 Testing

```bash
# Test API endpoints
curl -X GET http://localhost:5000/api/health

# Test authentication
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}'
```

## 📝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- [Google Apps Script URL](https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec)
- [Google Drive Folder](https://drive.google.com/drive/folders/1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Vercel Setup](./VERCEL_SETUP.md)

## 📞 Support

Jika ada masalah atau pertanyaan, buka issue di repository atau hubungi developer.

---

**Built with ❤️ for Indonesian students**