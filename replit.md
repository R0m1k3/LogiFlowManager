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

### July 17, 2025 - DLC Dashboard Integration Complete & Roles Management Enhanced
- **MODULE DLC INTÉGRÉ TABLEAU DE BORD** - Carte "Statut DLC" remplace "Statut des Commandes" avec données temps réel
- **ALERTES DLC AJOUTÉES** - Notifications automatiques pour produits expirant sous 15 jours et expirés
- **FILTRAGE MAGASIN DLC CORRIGÉ** - Page DLC connectée au sélecteur global de magasin
- **GENCODE EAN13 OPÉRATIONNEL** - Champ gencode mappé correctement côté serveur pour création/modification
- **LOGIQUE EXPIRATION HARMONISÉE** - Calcul dynamique 15 jours cohérent entre stats et filtres
- **CARTES DASHBOARD OPTIMISÉES** - Cartes du haut conservées (livraisons, commandes en attente, délai moyen, total palettes)
- **PERMISSIONS DLC COMPLÈTES** - 7 permissions DLC ajoutées au système de rôles : voir, créer, modifier, supprimer, valider, imprimer, statistiques
- **CATÉGORIES PERMISSIONS FRANÇAIS** - Toutes les catégories traduites : gestion_dlc, tableau_de_bord, magasins, fournisseurs, commandes, livraisons, publicites, commandes_clients, utilisateurs, gestion_roles, administration
- **MIGRATIONS PRODUCTION PRÊTES** - Scripts SQL de migration intégrés dans initDatabase.production.ts pour déploiement automatique
- **ROUTING PRODUCTION CORRIGÉ** - Configuration RouterProduction.tsx optimisée pour éviter erreurs 404
- **PRODUCTION BUG FIX** - Correction synchronisation statut commandes : `createDelivery` et `updateDelivery` en production mettent maintenant à jour statut commande vers "planned"
- **COULEURS RÔLES CORRIGÉ** - Page Rôles utilise maintenant `role.color` (base de données) au lieu de couleurs statiques pour cohérence avec page Utilisateurs
- **NUMÉROTATION SEMAINES PUBLICITÉ CORRIGÉ** - Remplacement `getWeek()` par numérotation séquentielle (1-53) et logique mois améliorée pour éliminer doublons semaine 1 en décembre
- **PERMISSIONS DLC PRODUCTION RÉSOLU** - Corrigé affichage permissions DLC en production : ajout permissions manquantes au rôle directeur, amélioration traductions catégories frontend
- **SCRIPT SQL PRODUCTION CRÉÉ** - Script fix-production-permissions.sql pour corriger displayName des permissions en production (problème spécifique production vs développement)
- **AUTHENTIFICATION PRODUCTION CORRIGÉE** - Résolu erreurs 401 en production : suppression double import et appel await incorrect dans localAuth.production.ts
- **DIAGNOSTIC PRODUCTION ACTIVÉ** - Logs détaillés ajoutés pour traquer les problèmes d'authentification et permissions
- **ROUTES DLC PRODUCTION CORRIGÉES** - Ajout complet des routes DLC manquantes dans routes.production.ts (GET /api/dlc-products, GET /api/dlc-products/stats, POST, PUT, DELETE) - résout les erreurs 404 en production
- **STORAGE ENVIRONNEMENT ADAPTATIF** - Routes utilisent maintenant le storage approprié selon NODE_ENV (développement = Drizzle ORM, production = raw SQL)
- **MAPPING CHAMPS DLC CORRIGÉ** - Storage production supporte les deux formats : `dlcDate` (nouveau) et `expiryDate` (ancien) pour compatibilité frontend/backend
- **FORMAT DATE ISO CORRIGÉ** - Toutes les dates du storage production converties en chaînes ISO pour éviter erreur "Invalid time value" dans le frontend
- **CRÉATION DLC PRODUCTION FONCTIONNELLE** - Résolu problèmes mapping produits DLC en production avec support backward compatibility

### Production Readiness Status - July 17, 2025
- **DATABASE MIGRATIONS** ✅ Toutes les migrations automatiques intégrées dans initDatabase.production.ts
- **DLC TABLE PRODUCTION** ✅ Table dlc_products ajoutée au script de création de base de données production
- **PERMISSIONS SYSTEM** ✅ 49 permissions créées avec 4 rôles (admin, manager, employé, directeur)
- **ROLE INITIALIZATION** ✅ Initialisation automatique des rôles/permissions intégrée au script production
- **DLC MODULE** ✅ Module complet opérationnel avec permissions et statistiques
- **ROUTING** ✅ Configuration production stable sans erreurs 404
- **TRANSLATIONS** ✅ Interface complètement en français avec catégories localisées
- **ROLE MANAGEMENT** ✅ Interface de gestion des rôles et permissions fonctionnelle
- **PRODUCTION BUGS FIXED** ✅ Création produits DLC corrigée : table et initialisation complètes
- **DOCKER BUILD FIXED** ✅ Erreur esbuild résolue : imports @shared corrigés et template literals ES6 compatibles

The system is designed to be highly maintainable with clear separation of concerns, comprehensive error handling, and robust security measures suitable for production deployment while maintaining excellent developer experience.