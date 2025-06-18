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
- ✓ Successfully migrated project to Replit environment
- ✓ Fixed posting functionality with proper Twitter-like interface
- ✓ Implemented Google Drive image upload with proper URL conversion
- ✓ Added image preview and error handling for Google Drive images
- ✓ Enhanced posting form with character count and upload status
- ✓ Fixed image display issues in post cards with fallback placeholders
- ✓ Completed project import and verified all functionality working

## User Preferences
- Language: Indonesian for UI text and error messages
- Development approach: Focus on functionality and data integrity
- Clean, readable code structure with proper error handling
- Image storage: Google Drive integration preferred
- Posting system: Twitter-like interface with real-time updates