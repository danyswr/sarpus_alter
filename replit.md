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
- ✓ Fixed image display issues - images now load properly in post cards
- ✓ Added real-time post updates with 10-second auto-refresh
- ✓ Implemented like/dislike spam prevention with user interaction tracking
- ✓ Enhanced delete functionality with proper permission checks
- ✓ Created comprehensive Google Apps Script with UserInteractions sheet
- ✓ Optimized real-time performance with optimistic updates for create/delete/like operations
- ✓ Fixed post ordering - new posts now appear at top immediately
- ✓ Implemented edit functionality for posts (title and description only)
- ✓ Improved timestamp formatting and duplicate key issues
- ✓ Enhanced delete performance with optimistic UI updates
- ✓ Fixed comment system implementation with fallback mechanisms
- ✓ Added robust error handling for Google Apps Script connectivity issues
- ✓ Updated backend to match new Google Apps Script structure (likePost action)
- ✓ Implemented HTML error detection for Google Apps Script responses
- ✓ Created optimistic UI updates for comment and like functionality

## User Preferences
- Language: Indonesian for UI text and error messages
- Development approach: Focus on functionality and data integrity
- Clean, readable code structure with proper error handling
- Image storage: Google Drive integration preferred
- Posting system: Twitter-like interface with real-time updates