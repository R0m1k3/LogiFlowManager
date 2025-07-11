# LogiFlow - Gestion Commandes & Livraisons

## Description
Application web de gestion logistique pour La Foir'Fouille avec système de commandes, livraisons et rapprochement BL/Factures.

## Technologies
- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Backend**: Node.js + Express + PostgreSQL  
- **Auth**: Système local avec rôles (Admin/Manager/Employee)
- **Build**: Vite + esbuild
- **Déploiement**: Docker

## Installation Développement

```bash
npm install
npm run dev
```

## Déploiement Production

```bash
# Build et lancement
docker-compose up -d

# Accès: http://votre-serveur:3000
# Connexion: admin / admin
```

## Structure

- `client/` - Interface React
- `server/` - API Express  
- `shared/` - Types partagés
- `Dockerfile` - Configuration Docker
- `docker-compose.yml` - Orchestration
- `init.sql` - Schema PostgreSQL

## Fonctionnalités

✅ Dashboard avec statistiques  
✅ Gestion commandes et livraisons  
✅ Calendrier interactif  
✅ Rapprochement BL/Factures  
✅ Gestion utilisateurs et magasins  
✅ Système de rôles et permissions  

## Support
Voir `replit.md` pour la documentation technique complète.