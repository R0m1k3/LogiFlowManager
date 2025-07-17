# LogiFlow - Replit Development Guide

## Overview

LogiFlow is a comprehensive logistics management platform designed for La Foir'Fouille retail stores. It provides centralized management of orders, deliveries, customer orders, inventory tracking, and user administration across multiple store locations.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and optimized production builds
- **UI Framework**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming
- **State Management**: TanStack Query (React Query) for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with ES modules
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Authentication**: Dual authentication system supporting both local auth (production) and Replit Auth (development)
- **Session Management**: Express sessions with PostgreSQL storage
- **Security**: Comprehensive security middleware including rate limiting, input sanitization, and security headers

### Database Architecture
- **Primary Database**: PostgreSQL with Drizzle ORM
- **Development**: Neon serverless PostgreSQL
- **Production**: Standard PostgreSQL in Docker containers
- **Schema**: Centralized schema definition in `shared/schema.ts`
- **Migrations**: Drizzle Kit for database migrations

## Key Components

### Authentication System
The application uses a sophisticated dual authentication approach:
- **Development Environment**: Utilizes Replit Auth for seamless development experience
- **Production Environment**: Implements local authentication with secure password hashing using Node.js crypto module
- **Session Management**: PostgreSQL-backed sessions with automatic cleanup
- **Security**: PBKDF2 password hashing, timing-safe comparisons, and secure session handling

### Multi-Store Management
- **Store Selection**: Global store context allowing users to filter data by specific stores
- **Role-Based Access**: Different permission levels (admin, manager, employee, directeur) with specific access controls
- **Data Isolation**: Store-specific data filtering while maintaining administrative oversight

### Core Business Entities
1. **Orders**: Purchase orders with supplier relationships, delivery tracking, and status management
2. **Deliveries**: Delivery tracking with order associations and completion status
3. **Customer Orders**: Point-of-sale customer order management with barcode generation
4. **Suppliers**: Vendor management with contact information and order history
5. **Publicities**: Marketing campaign management with store participation tracking

### External Integrations
- **NocoDB Integration**: Configurable integration with NocoDB for invoice verification and data synchronization
- **Barcode Generation**: Client-side barcode generation for customer orders using JsBarcode library

## Data Flow

### Request Flow
1. Client sends authenticated requests through React Query
2. Express middleware validates authentication and applies security checks
3. Route handlers process business logic using storage layer
4. Drizzle ORM handles database operations with type safety
5. Responses are cached appropriately and returned to client

### Authentication Flow
- **Development**: Automatic Replit Auth integration with user profile sync
- **Production**: Username/password authentication with secure session management
- **Authorization**: Role-based permissions checked on each protected route

### Data Synchronization
- **Real-time Updates**: React Query provides optimistic updates and background synchronization
- **Cache Management**: Intelligent cache invalidation on data mutations
- **Store Context**: Global store selection affects all data queries automatically

## External Dependencies

### Frontend Dependencies
- **UI Components**: Radix UI primitives for accessible, unstyled components
- **Form Management**: React Hook Form with Zod schema validation
- **Date Handling**: date-fns for internationalized date operations
- **Query Management**: TanStack Query for server state synchronization
- **Barcode Generation**: JsBarcode for customer order barcodes

### Backend Dependencies
- **Database**: PostgreSQL with pg driver and Drizzle ORM
- **Authentication**: Passport.js with local strategy
- **Session Storage**: connect-pg-simple for PostgreSQL session storage
- **Security**: express-rate-limit, helmet equivalent security headers
- **Validation**: Zod for runtime type validation

### Development Dependencies
- **Build Tools**: Vite with React plugin and TypeScript support
- **Code Quality**: ESLint and TypeScript compiler for type checking
- **Development Server**: Vite dev server with HMR and Replit integration

## Deployment Strategy

### Development Environment
- **Platform**: Replit with automatic environment detection
- **Database**: Neon serverless PostgreSQL
- **Authentication**: Replit Auth integration
- **Hot Reload**: Vite HMR with Replit cartographer integration

### Production Environment
- **Platform**: Docker containers with Alpine Linux
- **Database**: Standard PostgreSQL with connection pooling
- **Authentication**: Local authentication with crypto-based password hashing
- **Build Process**: Vite build for frontend, esbuild for backend bundling
- **Static Serving**: Express serves built frontend assets
- **Security**: Production-grade security headers, rate limiting, and input validation

### Configuration Management
- **Environment Variables**: DATABASE_URL, SESSION_SECRET, NODE_ENV
- **Build Targets**: Separate configurations for development and production
- **Asset Management**: Vite handles asset optimization and bundling
- **Path Resolution**: Configured aliases for clean import paths

## Recent Changes

### July 17, 2025 - Production Cleanup Complete
- **NETTOYAGE COMPLET PROJET FINALISÉ** - Suppression de 75+ fichiers obsolètes (scripts, docs, assets debug)
- **PROJET OPTIMISÉ PRODUCTION** - Structure épurée avec seulement les fichiers essentiels
- **ESPACE DISQUE LIBÉRÉ** - Suppression attached_assets/ et tous fichiers temporaires de développement
- **SIZE OPTIMIZED** - Réduction de 123M pour structure propre et déployable
- **MODAL RÔLES PROFESSIONNEL** - Interface confirmation moderne avec icône Shield remplace window.confirm
- **PRODUCTION BUG FIX** - Correction synchronisation statut commandes : `createDelivery` et `updateDelivery` en production mettent maintenant à jour statut commande vers "planned" (synchronisation dev/prod)

The system is designed to be highly maintainable with clear separation of concerns, comprehensive error handling, and robust security measures suitable for production deployment while maintaining excellent developer experience.