# 🚨 NETTOYAGE D'URGENCE - CONTENEUR POSTGRES UNHEALTHY

## Problème identifié
Le conteneur PostgreSQL est "unhealthy" car il contient l'ancienne base défectueuse.

## Solution immédiate

### 1. Connectez-vous à votre serveur
```bash
ssh user@your-server
cd /path/to/logiflow/
```

### 2. Nettoyage complet (OBLIGATOIRE)
```bash
# Arrêter tout
docker-compose down

# Supprimer les conteneurs
docker rm -f logiflow-app logiflow-db logiflow-postgres

# Supprimer les volumes (ESSENTIEL)
docker volume rm logiflow_postgres_data
docker volume prune -f

# Nettoyer les images
docker rmi $(docker images | grep logiflow | awk '{print $3}')
docker system prune -f
```

### 3. Vérifier que tout est supprimé
```bash
docker ps -a | grep logiflow
docker volume ls | grep logiflow
```

### 4. Redémarrer avec le nouveau schéma
```bash
# Avec les nouveaux fichiers (init.sql complet)
docker-compose up -d --build
```

## Résultat attendu
- PostgreSQL healthy avec le bon schéma
- Toutes les colonnes présentes
- Application fonctionnelle

**Le problème vient de l'ancienne base qui doit être complètement supprimée !**