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
- ✓ Successfully migrated project from Replit Agent to Replit environment
- ✓ Created modern full-stack JavaScript architecture with proper client/server separation
- ✓ Implemented TypeScript schema with Zod validation for data integrity
- ✓ **COMPLETED**: Full Google Sheets integration with direct API connection
- ✓ **COMPLETED**: Google Apps Script storage layer replacing in-memory storage
- ✓ **COMPLETED**: All requested features implemented:
  - Login/Register with default user role
  - Dashboard with posting system (text, title, image upload)
  - Like system with spam prevention (one like per user per post)
  - Comment system with Google Sheets storage
  - Search functionality (users, posts, titles, descriptions)
  - Profile management with 40-day update restriction
  - Notification system for user activities
  - Admin dashboard with user management and statistics
  - Image upload to Google Drive integration
- ✓ Fixed all TypeScript schema errors and API routes
- ✓ Added comprehensive API endpoints for all platform features
- ✓ Integrated with provided Google Apps Script URL and Drive folder
- ✓ **FIXED**: Delete post functionality - improved user ownership verification and error handling
  - Users can now properly delete their own posts
  - Enhanced authorization checks and clearer error messages
  - Fixed backend route to properly validate post ownership

## User Preferences
- Language: Indonesian for UI text and error messages
- Development approach: Focus on functionality and data integrity
- Clean, readable code structure with proper error handling
- Image storage: Google Drive integration preferred
- Posting system: Twitter-like interface with real-time updates