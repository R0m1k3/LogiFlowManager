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
- **Local authentication**: Email/password authentication with PostgreSQL storage
- **Three-tier role system**: Admin, Manager, Employee
- **Session persistence** in PostgreSQL with secure session management
- **Role-based access control** throughout the application
- **User creation workflow**: Admins can create users with email/password credentials
- **Multi-store access control**: Users see only data from their assigned stores
- **Default admin account**: admin@logiflow.com / admin123 (created automatically)

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
- **Admin**: Full access to all features, user management, and store switching
- **Manager**: Supplier and group management across multiple stores
- **Employee**: View and create within assigned groups only

### Store Management for Admins
- **Store selector in header**: Admins can switch between stores or view all data
- **Visual indicators**: Each store has a color-coded identifier
- **Data filtering**: All modules filter data based on selected store
- **"Tous les magasins" option**: View aggregated data across all stores

## Data Flow

### User Authentication Flow
1. User accesses application → Local login form with email/password
2. Successful authentication → User session created and stored in PostgreSQL
3. Role-based navigation and feature access applied
4. Admin can create new user accounts with store assignments

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
- **Local authentication**: Email/password with bcrypt hashing
- **Session storage**: PostgreSQL with connect-pg-simple
- **Passport.js**: Authentication middleware with local strategy

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
- July 08, 2025. Implemented local authentication system with PostgreSQL storage
- July 08, 2025. Added complete Docker containerization with PostgreSQL
- July 08, 2025. Created production-ready deployment configuration
- July 09, 2025. Implemented user deletion functionality with safety protections
- July 09, 2025. Redesigned dashboard with modern UI based on user template
- July 09, 2025. Reorganized navigation menu with Dashboard as first item
- July 09, 2025. Implemented intelligent store auto-selection for order/delivery creation forms
- July 09, 2025. Hidden store selector for non-admin users in creation modals
- July 09, 2025. Removed quantity and unit fields from order creation - only kept for deliveries
- July 09, 2025. Updated database schema to make quantity/unit optional for orders
- July 09, 2025. Fixed admin store selector visibility and functionality in creation modals
- July 09, 2025. Removed quantity display from order details modal, calendar, and orders table
- July 10, 2025. Improved delivery modal with supplier-first workflow and order filtering
- July 10, 2025. Relocated user profile and logout to bottom of sidebar for better UX
- July 10, 2025. Replaced header user info with store selector for admins
- July 10, 2025. Added ability for admins to view all stores or filter by specific store
- July 10, 2025. Implemented status management: orders linked to deliveries automatically become "planned"
- July 10, 2025. Added edit functionality for both orders and deliveries with proper role-based access
- July 10, 2025. Created comprehensive edit modals with form validation and error handling
- July 10, 2025. Removed store selectors from creation modals with intelligent auto-selection
- July 10, 2025. Replaced "Fonction à venir" message with fully functional edit modals
- July 10, 2025. Fixed SelectItem empty value errors in form components
- July 10, 2025. Fixed order filtering in delivery creation - orders from all dates now visible
- July 10, 2025. Improved order display in delivery modals with supplier name and date
- July 10, 2025. Added "Aucune commande liée" option for clearer interface
- July 10, 2025. Fixed statistics panel to filter by selected store for admins
- July 10, 2025. Statistics now update correctly when switching between stores
- July 10, 2025. Fixed Orders and Deliveries pages to show complete history without date filtering
- July 10, 2025. Calendar shows monthly data, Orders/Deliveries pages show all historical data
- July 10, 2025. Hidden group/store filter in Orders and Deliveries pages for non-admin users
- July 10, 2025. Simplified interface for employees and managers who only see their assigned stores
- July 10, 2025. Added "En attente" status display for deliveries with pending status
- July 10, 2025. Enhanced calendar visual indicators for pending deliveries and linked orders
- July 10, 2025. Orders linked to pending deliveries now show orange background with indicator dot

## User Preferences

Preferred communication style: Simple, everyday language.