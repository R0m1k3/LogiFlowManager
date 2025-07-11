# Structure du Projet LogiFlow

## Fichiers Essentiels

### Configuration
- `package.json` - Dépendances Node.js
- `tsconfig.json` - Configuration TypeScript  
- `vite.config.ts` - Configuration Vite (dev server)
- `tailwind.config.ts` - Configuration Tailwind CSS
- `postcss.config.js` - Configuration PostCSS
- `components.json` - shadcn/ui components

### Déploiement
- `Dockerfile` - Image Docker pour production
- `docker-compose.yml` - Orchestration complète (app + PostgreSQL)
- `init.sql` - Schema initial de la base de données

### Code Source
- `client/` - Interface React + TypeScript
- `server/` - API Express + PostgreSQL  
- `shared/` - Types TypeScript partagés
- `dist/` - Build frontend
- `test-dist/` - Build backend bundlé

### Documentation
- `README.md` - Guide rapide d'installation
- `replit.md` - Documentation technique complète
- `.env.example` - Variables d'environnement

## Nettoyage Effectué

✅ **20+ scripts** de déploiement redondants supprimés  
✅ **5 fichiers** de documentation obsolète supprimés  
✅ **Assets temporaires** nettoyés (gardé seulement la dernière capture)  
✅ **Fichiers de configuration** nginx obsolètes supprimés  
✅ **Cookies et logs** temporaires supprimés  

## Résultat

Le projet est maintenant **propre et maintenable** avec seulement les fichiers essentiels.