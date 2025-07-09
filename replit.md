# LogiFlow - Gestion Commandes & Livraisons

## Overview

LogiFlow is a web application for managing orders and deliveries across multiple stores with a centralized calendar system and role-based permissions. Built for La Foir'Fouille, it provides a comprehensive solution for logistics management with an intuitive calendar interface and user role management.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **UI Library**: Radix UI components with shadcn/ui system
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state management
- **Routing**: Wouter for lightweight client-side routing

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: PostgreSQL-backed sessions with connect-pg-simple
- **API**: RESTful API with role-based access control

## Key Components

### Authentication System
- **Dual authentication support**: Replit Auth (development) and Local Auth (production/Docker)
- **Three-tier role system**: Admin, Manager, Employee
- **OpenID Connect integration** via Replit Auth for development
- **Local authentication** with email/password for Docker deployment
- **Session persistence** in PostgreSQL
- **Role-based access control** throughout the application
- **User creation workflow**: Admins can create users who authenticate via existing Replit accounts or local accounts
- **Multi-store access control**: Users see only data from their assigned stores

### Calendar Management
- **Monthly calendar view** with interactive navigation
- **Color-coded items**: Orders (blue), Deliveries (green)
- **Visual status indicators**: Delivered items shown in gray
- **Quick creation workflow**: Click date → Create order/delivery

### Data Management
- **Orders**: Supplier orders with planned dates and quantities
- **Deliveries**: Delivery scheduling linked to orders
- **Suppliers**: Supplier contact information and management
- **Groups**: Store/location groupings with color coding
- **User Groups**: Many-to-many relationship for access control

### Permission System
- **Admin**: Full access to all features and user management
- **Manager**: Supplier and group management across multiple stores
- **Employee**: View and create within assigned groups only

## Data Flow

### User Authentication Flow
1. User accesses application → Redirected to Replit Auth
2. Successful authentication → User data stored/updated in database
3. Session created and stored in PostgreSQL
4. Role-based navigation and feature access applied

### Order/Delivery Management Flow
1. User selects date on calendar → Quick create menu appears
2. Form submission → Validation and database insertion
3. Real-time UI updates via TanStack Query invalidation
4. Calendar refreshes to show new items

### Database Relations
- Users ↔ UserGroups ↔ Groups (many-to-many)
- Orders → Suppliers (many-to-one)
- Orders → Groups (many-to-one)
- Deliveries → Orders (many-to-one)
- Deliveries → Suppliers (many-to-one)

## External Dependencies

### Database
- **Neon PostgreSQL**: Serverless PostgreSQL database
- **Drizzle ORM**: Type-safe database operations
- **Connection pooling**: @neondatabase/serverless with WebSocket support

### Authentication
- **Replit Auth**: OpenID Connect provider
- **Session storage**: PostgreSQL with connect-pg-simple
- **Passport.js**: Authentication middleware

### UI/UX
- **Radix UI**: Accessible component primitives
- **Tailwind CSS**: Utility-first CSS framework
- **Date-fns**: Date manipulation library with French locale
- **Lucide React**: Icon library

## Deployment Strategy

### Development Setup
- **Hot reload**: Vite development server with HMR
- **Database migrations**: Drizzle Kit for schema management
- **Environment variables**: DATABASE_URL, SESSION_SECRET, REPLIT_DOMAINS

### Production Build
- **Frontend**: Vite build process creates optimized static assets
- **Backend**: esbuild bundles Node.js application
- **Static serving**: Express serves built frontend assets
- **Database**: Neon PostgreSQL with connection pooling

### Build Commands
- `npm run dev`: Development server with hot reload
- `npm run build`: Production build (frontend + backend)
- `npm run start`: Production server
- `npm run db:push`: Deploy database schema changes

### Docker Deployment
- **Complete Docker setup**: Dockerfile, docker-compose.yml, and initialization scripts
- **Local authentication**: Automatic switch to local auth in Docker environment
- **PostgreSQL container**: Pre-configured with database initialization
- **Default admin account**: admin@logiflow.com / admin123
- **Health checks**: Application and database monitoring
- **Volume persistence**: Database data and uploads

## Changelog

Changelog:
- July 08, 2025. Initial setup
- July 08, 2025. Implemented multi-store system with user management and role-based permissions
- July 08, 2025. Added comprehensive user creation interface with store assignments
- July 08, 2025. Enhanced authentication documentation and user onboarding process
- July 08, 2025. Implemented dual authentication system (Replit Auth + Local Auth)
- July 08, 2025. Added complete Docker containerization with PostgreSQL
- July 08, 2025. Created production-ready deployment configuration
- July 09, 2025. Implemented user deletion functionality with safety protections
- July 09, 2025. Redesigned dashboard with modern UI based on user template

## User Preferences

Preferred communication style: Simple, everyday language.