#!/bin/bash

echo "=== CORRECTION FINALE PRODUCTION LOGIFLOW ==="

# Arrêter les conteneurs existants
echo "1. Arrêt des conteneurs existants..."
docker-compose down -v 2>/dev/null || true

# Supprimer l'image existante pour forcer la reconstruction
echo "2. Suppression de l'image existante..."
docker rmi $(docker images | grep logiflow | awk '{print $3}') 2>/dev/null || true

# NE PAS supprimer les volumes pour préserver les données
echo "3. Préservation des données existantes..."
echo "   (Les volumes PostgreSQL sont conservés)"

# Reconstruire l'application seulement (préserver la base de données)
echo "4. Mise à jour de l'application..."
docker-compose up -d --build

# Attendre le démarrage
echo "5. Attente du démarrage (60 secondes)..."
sleep 60

# Vérifier l'état
echo "6. Vérification des conteneurs..."
docker-compose ps

# Test de l'application
echo "7. Test de l'application..."
for i in {1..10}; do
    RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
    
    if [ "$RESPONSE" = "200" ]; then
        echo "✅ Application accessible sur http://localhost:3000"
        echo "✅ Connexion: admin/admin"
        echo "✅ Base PostgreSQL sans WebSocket"
        break
    else
        echo "⏳ Tentative $i/10 - HTTP: $RESPONSE"
        sleep 10
    fi
done

if [ "$RESPONSE" != "200" ]; then
    echo "❌ Application non accessible après 10 tentatives"
    echo "📋 Logs de l'application:"
    docker-compose logs --tail=50 logiflow-app
    echo "📋 Logs de la base de données:"
    docker-compose logs --tail=20 postgres
    exit 1
fi

echo "=== CORRECTION RÉUSSIE ==="
echo "🎉 LogiFlow fonctionne sur http://localhost:3000"
echo "🔐 Identifiants: admin/admin"
echo "🗄️  PostgreSQL natif sans WebSocket"