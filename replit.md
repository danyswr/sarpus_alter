# FeedbackU - Student Feedback Platform

## Overview

FeedbackU is a modern student feedback platform built with a React frontend and Express backend. The application allows students to create posts, share feedback, and interact with content through likes/dislikes. It features role-based access control with admin capabilities and uses PostgreSQL as the database with Drizzle ORM for data management.

## System Architecture

The application follows a full-stack architecture with clear separation between frontend and backend:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI components
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for client-side routing
- **Build Tool**: Vite for development and build process
- **UI Components**: Radix UI primitives with custom styling

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database**: PostgreSQL with Drizzle ORM
- **Database Provider**: Neon Database serverless
- **Session Management**: Express sessions with PostgreSQL store
- **File Structure**: Modular architecture with separate routes and storage layers

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
The application uses two main tables:
- **Users**: Stores user information including credentials, student details (NIM, jurusan), and roles
- **Posts**: Stores post content, metadata, and engagement metrics (likes/dislikes with user tracking)

## Data Flow

1. **User Registration/Login**: Frontend forms submit to `/api/auth/` endpoints
2. **Post Creation**: Authenticated users submit posts via `/api/posts` endpoint
3. **Post Interaction**: Like/dislike actions update post engagement metrics
4. **Real-time Updates**: TanStack Query handles cache invalidation and refetching
5. **Admin Operations**: Admin users can delete posts and view system analytics

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

## Changelog

```
Changelog:
- June 18, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```