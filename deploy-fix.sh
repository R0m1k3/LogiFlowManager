#!/bin/bash

echo "🚀 Déploiement rapide avec corrections WebSocket"
echo "=============================================="

# Arrêter les conteneurs existants
echo "1. Arrêt des conteneurs existants..."
docker-compose -f docker-compose.production.yml down

# Supprimer l'ancienne image
echo "2. Suppression de l'ancienne image..."
docker rmi logiflow-app-logiflow-app 2>/dev/null || echo "Aucune ancienne image trouvée"

# Rebuild avec cache forcé
echo "3. Reconstruction de l'image avec corrections..."
docker-compose -f docker-compose.production.yml build --no-cache

# Redémarrer avec les nouvelles images
echo "4. Démarrage avec nouvelles images..."
docker-compose -f docker-compose.production.yml up -d

# Attendre que les services soient prêts
echo "5. Vérification des services..."
sleep 10

# Tester le health check
echo "6. Test health check..."
curl -s http://localhost:5001/api/health || echo "Service pas encore prêt"

echo ""
echo "✅ Déploiement terminé !"
echo "   - Application: http://localhost:5001"
echo "   - Health check: http://localhost:5001/api/health"
echo ""
echo "Vérifiez les logs:"
echo "   docker-compose -f docker-compose.production.yml logs -f logiflow-app"