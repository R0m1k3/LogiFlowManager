#!/bin/bash

echo "🔍 DIAGNOSTIC CONNECTIVITÉ LOGIFLOW"
echo "================================="

# Vérifier que Docker fonctionne
if ! command -v docker &> /dev/null; then
    echo "❌ Docker non installé"
    exit 1
fi

echo "✅ Docker installé"

# Vérifier les conteneurs
echo ""
echo "📊 ÉTAT DES CONTENEURS:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAMES|logiflow)" || echo "❌ Aucun conteneur logiflow trouvé"

# Vérifier les logs
echo ""
echo "📋 LOGS APPLICATION (20 dernières lignes):"
if docker ps | grep -q "logiflow-app"; then
    docker logs logiflow-app --tail 20
else
    echo "❌ Conteneur logiflow-app non trouvé"
fi

# Vérifier les ports
echo ""
echo "🔌 PORTS EXPOSÉS:"
if docker ps | grep -q "logiflow-app"; then
    docker port logiflow-app
else
    echo "❌ Impossible de vérifier les ports"
fi

# Test connectivité locale
echo ""
echo "🌐 TEST CONNECTIVITÉ LOCALE:"
if curl -s -f http://localhost:8080/api/health > /dev/null 2>&1; then
    echo "✅ Port 8080 accessible localement"
    curl -s http://localhost:8080/api/health | jq . 2>/dev/null || curl -s http://localhost:8080/api/health
else
    echo "❌ Port 8080 non accessible localement"
    echo "Tentative curl détaillée :"
    curl -v http://localhost:8080/api/health 2>&1 | head -10
fi

# Vérifier le réseau Docker
echo ""
echo "🔗 RÉSEAU DOCKER:"
if docker network ls | grep -q nginx_default; then
    echo "✅ Réseau nginx_default existe"
    echo "Détails du réseau :"
    docker network inspect nginx_default --format='{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{"\n"}}{{end}}' 2>/dev/null || echo "Erreur inspection réseau"
else
    echo "❌ Réseau nginx_default inexistant"
    echo "Réseaux disponibles :"
    docker network ls
fi

# Vérifier les processus sur le port 8080
echo ""
echo "🔍 PROCESSUS PORT 8080:"
if command -v ss &> /dev/null; then
    ss -tulpn | grep :8080 || echo "Aucun processus sur le port 8080"
elif command -v netstat &> /dev/null; then
    netstat -tulpn | grep :8080 || echo "Aucun processus sur le port 8080"
else
    echo "ss/netstat non disponible"
fi

# Suggestions de résolution
echo ""
echo "🔧 SUGGESTIONS DE RÉSOLUTION:"
echo "1. Si conteneur n'existe pas : docker-compose up -d"
echo "2. Si conteneur crash : vérifier les logs détaillés"
echo "3. Si port non accessible : vérifier firewall/iptables"
echo "4. Si réseau manquant : docker network create nginx_default"
echo "5. Si application ne répond pas : redémarrer le conteneur"

echo ""
echo "📞 COMMANDES UTILES:"
echo "docker-compose restart logiflow-app"
echo "docker-compose logs -f logiflow-app"
echo "docker exec -it logiflow-app sh"