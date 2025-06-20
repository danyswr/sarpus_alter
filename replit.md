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
- ✓ Updated backend to use Express server with in-memory storage
- ✓ Fixed frontend API integration to work with new backend routes
- ✓ Configured React Query with token-based authentication
- ✓ Migrated from Google Apps Script to Express server endpoints
- ✓ Maintained Google Sheets data structure compatibility in new schema
- ✓ Fixed authentication system to support both bcrypt and plain text passwords for migration
- ✓ Added comprehensive API routes for posts, comments, users, and admin functionality
- ✓ Updated storage implementation with proper user interaction tracking
- ✓ Fixed login authentication to work with migrated user credentials

## User Preferences
- Language: Indonesian for UI text and error messages
- Development approach: Focus on functionality and data integrity
- Clean, readable code structure with proper error handling
- Image storage: Google Drive integration preferred
- Posting system: Twitter-like interface with real-time updates