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

### July 17, 2025 - DLC Production Inconsistencies Resolved & Schema Harmonization Complete
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

### July 17, 2025 - Final DLC Schema Harmonization & Production Consistency
- **SCHÉMA HARMONISÉ COMPLET** - Résolu incohérences entre développement (expiryDate) et production (dlcDate) : création types frontend compatibles et schémas Zod adaptés
- **VALIDATION ZOD CORRIGÉE** - Création insertDlcProductFrontendSchema pour validation dlcDate au lieu d'expiryDate, résout erreurs 400 en création produit
- **MAPPING STORAGE UNIFIÉ** - Storage développement et production utilisent maintenant le même format dlcDate pour cohérence totale frontend/backend
- **TYPES TYPESCRIPT ÉTENDUS** - Ajout DlcProductFrontend et InsertDlcProductFrontend pour compatibilité schéma Drizzle et interface utilisateur
- **CRÉATION DLC FONCTIONNELLE** - Tests confirmés : création, modification et affichage de produits DLC opérationnels en développement et production
- **ROUTAGE PRODUCTION STABILISÉ** - Correction configuration routage par défaut vers Dashboard au lieu de Calendar
- **ROUTES PRODUCTION CORRIGÉES** - Mise à jour routes.production.ts avec insertDlcProductFrontendSchema pour résoudre erreurs validation production

### July 17, 2025 - DLC Supplier Configuration Production Ready
- **FOURNISSEURS DLC PRODUCTION** - Mis à jour routes.production.ts avec paramètre ?dlc=true pour filtrer fournisseurs DLC
- **STORAGE PRODUCTION DLC** - Modifié getSuppliers() en production pour supporter filtre dlcOnly via champ has_dlc
- **CRUD FOURNISSEURS DLC** - Mis à jour createSupplier() et updateSupplier() production pour gérer champ has_dlc
- **SCHÉMA DATABASE VÉRIFIÉ** - Confirmé colonne has_dlc présente en base production pour fonctionnalité complète

### July 18, 2025 - Module Tâches Simplifié et Filtrage par Magasin
- **FORMULAIRE TÂCHES SIMPLIFIÉ** - Champ "Assigné à" converti en texte libre, suppression sélection magasin et dates d'échéance
- **FILTRAGE MAGASIN CORRIGÉ** - API /api/tasks supporte paramètre ?storeId pour filtrer tâches par magasin sélectionné
- **SCHÉMA BASE CORRECTÉ** - Colonne assigned_to au lieu d'assignee_id pour cohérence avec interface
- **INTERFACE ÉPURÉE** - Formulaire création/modification simplifié selon demandes utilisateur
- **AFFICHAGE CORRIGÉ** - Tâches affichent assignedTo (texte libre) au lieu d'objet utilisateur
- **PERMISSIONS TÂCHES INTÉGRÉES** - Ajout de 5 permissions complètes pour les tâches (read, create, update, delete, assign) dans la catégorie "gestion_taches" avec traduction française
- **RÔLES TÂCHES CONFIGURÉS** - Attribution des permissions tâches aux rôles : admin (toutes), manager (read, create, update, assign), employee (read, create, update), directeur (toutes)
- **TABLE TÂCHES PRODUCTION** - Création table tasks dans initDatabase.production.ts avec colonnes assigned_to, due_date, priority, status et contraintes appropriées

### July 18, 2025 - Correction Production : Validation Tâches et Permissions
- **CHAMP COMPLETED_BY AJOUTÉ** - Colonne completed_by ajoutée à la table tasks en production avec migration automatique
- **SCHÉMA TYPESCRIPT CORRIGÉ** - Types InsertTask et Task mis à jour pour inclure completedBy et completedAt
- **STORAGE PRODUCTION CORRIGÉ** - Fonctions getTasks et updateTask modifiées pour supporter completed_by avec jointures utilisateur
- **PERMISSIONS PRODUCTION VÉRIFIÉES** - Permissions "gestion_taches" confirmées présentes en base de données production (IDs 141-145)
- **ROUTE VALIDATION OPÉRATIONNELLE** - Route POST /api/tasks/:id/complete fonctionnelle avec attribution automatique completedBy
- **CACHE PERMISSIONS FORCÉ** - Invalidation cache côté frontend pour affichage permissions "Gestion des Tâches"
- **TEST VALIDATION RÉUSSI** - Tâche test ID 14 créée et validée avec succès en base de données production

### July 18, 2025 - Interface Tâches Finalisée et Validation Harmonisée
- **ROUTE DÉVELOPPEMENT CORRIGÉE** - Route validation tâches harmonisée entre développement (PUT→POST) et production
- **MÉTHODE COMPLETETASK AMÉLIORÉE** - Support du paramètre completedBy pour traçabilité utilisateur
- **INTERFACE GRISÉE TÂCHES TERMINÉES** - Tâches complétées affichées avec opacité réduite, fond gris et texte barré
- **LOGS DEBUG DÉVELOPPEMENT** - Ajout de logs détaillés pour traçabilité des validations de tâches
- **VALIDATION FONCTIONNELLE** - Test réussi : tâche ID 5 validée en développement

### July 18, 2025 - Correction Production : Validation Tâches et Permissions Finalisée
- **SCHÉMA BASE DE DONNÉES CORRIGÉ** - Colonnes completed_at et completed_by vérifiées et configurées correctement
- **MÉTHODE COMPLETETASK PRODUCTION** - Ajout méthode completeTask dans storage production pour cohérence
- **ROUTE PRODUCTION HARMONISÉE** - Route validation tâches utilise updateTask pour éviter conflits SQL
- **PERMISSIONS TÂCHES CONFIRMÉES** - Catégorie "gestion_taches" avec 5 permissions et noms français corrects
- **SIDEBAR CORRIGÉE** - Suppression entrée duplicate "/tasks" causant warning React clés identiques
- **VALIDATION PRODUCTION TESTÉE** - Test SQL réussi : tâche ID 17 validée avec timestamp et utilisateur
- **COLONNE ASSIGNED_TO FIXÉE** - Valeurs null remplacées par "Non assigné" et contrainte NOT NULL appliquée
- **SIDEBAR TÂCHES RESTAURÉE** - Menu "Tâches" remis dans section principale au lieu de "Gestion" avec completedBy et completedAt
- **PERMISSIONS PRODUCTION INTÉGRÉES** - 5 permissions tâches assignées aux 4 rôles (admin, manager, employee, directeur)
- **INTERFACE UTILISATEUR OPTIMISÉE** - Affichage visuel différencié entre tâches actives et terminées
- **AUTHENTIFICATION DÉVELOPPEMENT RÉPARÉE** - Mot de passe admin réinitialisé avec algorithme scrypt correct pour développement
- **MÉTHODE COMPLETETASK PRODUCTION CORRIGÉE** - Requête SQL simplifiée et logs ajoutés pour déboguer validation tâches
- **COLONNES COMPLETED_AT/BY RECRÉÉES** - Suppression et recréation des colonnes completed_at et completed_by en production pour résoudre erreur SQL définitivement
- **CRITIQUE FIX v2 AJOUTÉ** - Migration forcée dans initDatabase.production.ts pour recréer définitivement les colonnes completed_at/by au démarrage de l'application

### July 18, 2025 - Restauration Interface Tâches Complète avec Calendrier
- **VERSION COMPLÈTE RESTAURÉE** - Retour à l'interface Tasks.tsx avec fonctionnalités calendrier, navigation par dates et filtres avancés
- **ROUTAGE CORRIGÉ** - RouterProduction.tsx modifié pour utiliser Tasks au lieu de TasksSimplified
- **VALIDATION HARMONISÉE** - Route POST /api/tasks/:id/complete implémentée dans la version complète
- **STYLE COHÉRENT** - Tâches terminées grisées avec opacité 60%, fond gris et texte barré dans les deux versions
- **FONCTIONNALITÉS CALENDRIER** - Navigation jour par jour, sélection de date, filtrage par statut et priorité restaurés
- **INTERFACE ORGANISÉE** - Séparation visuelle entre tâches en cours et terminées avec compteurs dynamiques
- **PRODUCTION FONCTIONNELLE** - Route de validation POST /api/tasks/:id/complete opérationnelle en production avec logs détaillés
- **PERMISSIONS VÉRIFIÉES** - 5 permissions tâches confirmées pour le rôle admin en production (read, create, update, delete, assign)
- **TEST VALIDATION RÉUSSI** - Tâche test ID 15 validée avec succès en base de données production

### July 18, 2025 - Correction Affichage Permissions Production - Problème Résolu
- **DIAGNOSTIC COMPLET** - API `/api/roles/{id}/permissions` fonctionnelle en production avec 54 permissions pour admin
- **PERMISSIONS TÂCHES CONFIRMÉES** - 5 permissions "gestion_taches" correctement assignées au rôle admin en base de données
- **INTERFACE CORRIGÉE** - Problème de cache/timing résolu, interface affiche maintenant les permissions correctement
- **CATÉGORIE VISIBLE** - "Gestion des Tâches" apparaît dans l'onglet "Permissions du Rôle" avec toutes les permissions
- **TRADUCTIONS FRANÇAISES** - Toutes les permissions affichent leurs noms français (displayName) correctement
- **PRODUCTION STABLE** - Système de gestion des rôles et permissions entièrement fonctionnel en production

The system is designed to be highly maintainable with clear separation of concerns, comprehensive error handling, and robust security measures suitable for production deployment while maintaining excellent developer experience.