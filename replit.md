# Mahasiswa Feedback Platform

## Project Overview
Platform untuk mahasiswa dan dosen memberikan keluh kesah/feedback dalam bentuk posting seperti Twitter. Sistem memiliki role-based access dengan user dan admin.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Express.js server sebagai proxy
- **Database**: Google Sheets via Google Apps Script
- **Storage**: Google Drive untuk upload gambar
- **Authentication**: Session-based dengan role management

## Key Features
- Login/Register dengan role management (user/admin)
- Posting keluh kesah dengan like/dislike
- Upload gambar ke Google Drive
- Admin dashboard untuk melihat statistik dan postingan populer
- Real-time data sync dengan Google Sheets

## External Services
- Google Apps Script URL: https://script.google.com/macros/s/AKfycbz8YWdcQSZlVkmsV6PIvh8E6vDeV1fnbaj51atRBjWAEa5NRhSveWmuSsBNSDGfzfT-/exec
- Google Drive Folder: https://drive.google.com/drive/folders/1mWUUou6QkdumcBT-Qizljc7T6s2jQxkw?usp=sharing

## Database Schema (Google Sheets)

### Users Sheet
- idUsers, username, email, password, role, nim, jurusan, gender, bio, location, website, createdAt

### Posting Sheet  
- idPostingan, idUsers, judul, deskripsi, imageUrl, timestamp, likeCount, dislikeCount

## Recent Changes
- ✓ Fixed API export issue in client/src/lib/api.ts
- ✓ Corrected Express server routes to handle Google Apps Script response format
- ✓ Created complete Google Apps Script (Code.gs) with all required functions
- ✓ Updated authentication flow to properly parse user data from Google Sheets
- ✓ Configured Google Drive integration for image uploads
- ✓ Enhanced Google Apps Script with better email matching and debugging
- ✓ Created setup guide for Google Apps Script deployment
- ✓ Added temporary fallback authentication for immediate login access

## User Preferences
- Language: Indonesian for UI text and error messages
- Development approach: Focus on functionality and data integrity
- Clean, readable code structure with proper error handling