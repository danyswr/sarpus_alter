# FeedbackU - Student Feedback Platform

## Overview

FeedbackU is a modern student feedback platform built with a React frontend and Express backend. The application allows students to create posts, share feedback, and interact with content through likes/dislikes. It features role-based access control with admin capabilities and uses PostgreSQL as the database with Drizzle ORM for data management.

## System Architecture

The application follows a full-stack architecture with Google Apps Script as the backend database:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and build process
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Database**: Google Spreadsheet with Google Apps Script API
- **Image Storage**: Google Drive with public access links
- **Authentication**: Client-side session management with localStorage
- **API Integration**: Direct HTTP requests to Google Apps Script web app
- **File Structure**: Frontend-focused with Google backend integration

## Key Components

### Authentication System
- User registration and login functionality
- Role-based access control (user/admin)
- Session-based authentication
- Protected routes for authenticated users

### Post Management
- Create, read, update, delete posts
- Image upload support
- Like/dislike functionality with user tracking
- Post filtering and search capabilities

### User Roles
- **Regular Users**: Can create posts, like/dislike content, manage their profile
- **Admin Users**: Additional privileges to manage all posts and view analytics

### Database Schema
The application uses Google Spreadsheet with two main sheets:
- **Users Sheet**: Stores user information including credentials, student details (NIM, jurusan), and roles
- **Posts Sheet**: Stores post content, metadata, and engagement metrics (likes/dislikes with user tracking)

### Google Integration
- **Google Apps Script**: Serves as the backend API handling all database operations
- **Google Drive**: Stores uploaded images with public access links
- **Google Sheets**: Acts as the primary database with structured data storage

## Data Flow

1. **User Registration/Login**: Frontend makes direct requests to Google Apps Script web app
2. **Post Creation**: Posts are stored in Google Sheets with image URLs from Google Drive
3. **Post Interaction**: Like/dislike actions update spreadsheet cells with user tracking
4. **Image Upload**: Files are converted to base64 and uploaded to Google Drive folder
5. **Admin Operations**: Role-based access control managed through spreadsheet data

## External Dependencies

### Frontend Dependencies
- **React Ecosystem**: React, React DOM, React Hook Form
- **UI Libraries**: Radix UI components, Lucide React icons
- **State Management**: TanStack React Query
- **Styling**: Tailwind CSS, class-variance-authority
- **Form Validation**: Zod schema validation
- **Date Handling**: date-fns

### Backend Dependencies
- **Server Framework**: Express.js with middleware
- **Database**: Drizzle ORM with PostgreSQL adapter
- **Development Tools**: tsx for TypeScript execution, esbuild for production builds
- **Session Management**: connect-pg-simple for PostgreSQL session store

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

### Development Environment
- **Command**: `npm run dev` - Runs the application in development mode
- **Port**: 5000 (configured in .replit)
- **Hot Reload**: Vite HMR for frontend, tsx watch mode for backend

### Production Build
- **Build Process**: `npm run build` - Builds frontend assets and bundles backend
- **Start Command**: `npm run start` - Runs the production server
- **Database**: PostgreSQL module configured in Replit environment

### Database Migration
- **Schema Management**: Drizzle Kit for database migrations
- **Command**: `npm run db:push` - Pushes schema changes to database
- **Configuration**: Uses DATABASE_URL environment variable

The application uses Replit's autoscale deployment target with automatic SSL and custom domain support. The frontend is served as static files in production while the backend handles API requests.

## Recent Changes

**December 8, 2025:**
- ✅ Successfully migrated project from PostgreSQL to Google Apps Script + Google Spreadsheet backend
- ✅ Updated API routes to connect with Google Apps Script URL
- ✅ Configured frontend authentication to work with new backend
- ✅ Integrated Google Drive upload functionality for image handling
- ✅ Created comprehensive Google Apps Script code for all CRUD operations
- ✅ Project ready for deployment with Google infrastructure

## Changelog

```
Changelog:
- December 8, 2025: Migrated to Google Apps Script backend
- June 18, 2025: Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```