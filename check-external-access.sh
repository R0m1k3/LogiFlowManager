#!/bin/bash

echo "🔍 DIAGNOSTIC ACCÈS EXTERNE PORT 3000"
echo "===================================="

# 1. Vérifier le port mapping Docker
echo "1. PORT MAPPING DOCKER:"
docker port logiflow-app 2>/dev/null || echo "❌ Conteneur logiflow-app non trouvé"

# 2. Vérifier que le port 3000 est bien écouté
echo ""
echo "2. PORTS EN ÉCOUTE SUR LE SYSTÈME:"
if command -v ss &> /dev/null; then
    ss -tulpn | grep :3000 || echo "❌ Port 3000 non en écoute"
elif command -v netstat &> /dev/null; then
    netstat -tulpn | grep :3000 || echo "❌ Port 3000 non en écoute"
else
    echo "❓ ss/netstat non disponible"
fi

# 3. Test connectivité locale port 3000
echo ""
echo "3. TEST CONNECTIVITÉ LOCALE PORT 3000:"
if curl -s -f http://localhost:3000/api/health > /dev/null 2>&1; then
    echo "✅ Port 3000 accessible localement"
    echo "Réponse API:"
    curl -s http://localhost:3000/api/health | jq . 2>/dev/null || curl -s http://localhost:3000/api/health
else
    echo "❌ Port 3000 NON accessible localement"
    echo "Détail de l'erreur:"
    curl -v http://localhost:3000/api/health 2>&1 | head -5
fi

# 4. Test depuis IP externe (si disponible)
echo ""
echo "4. TEST IP EXTERNE:"
EXTERNAL_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "unknown")
echo "IP du serveur: $EXTERNAL_IP"

if [ "$EXTERNAL_IP" != "unknown" ]; then
    if curl -s -f http://$EXTERNAL_IP:3000/api/health > /dev/null 2>&1; then
        echo "✅ Port 3000 accessible depuis IP externe"
    else
        echo "❌ Port 3000 NON accessible depuis IP externe"
        echo "Cela indique un problème de firewall/iptables"
    fi
fi

# 5. Vérifier le réseau Docker
echo ""
echo "5. RÉSEAU DOCKER nginx_default:"
if docker network ls | grep -q nginx_default; then
    echo "✅ Réseau nginx_default existe"
    
    # Vérifier que les conteneurs sont sur ce réseau
    CONTAINERS_ON_NETWORK=$(docker network inspect nginx_default --format='{{range .Containers}}{{.Name}} {{end}}' 2>/dev/null)
    echo "Conteneurs sur nginx_default: $CONTAINERS_ON_NETWORK"
    
    if echo "$CONTAINERS_ON_NETWORK" | grep -q logiflow; then
        echo "✅ Conteneurs LogiFlow sur nginx_default"
    else
        echo "❌ Conteneurs LogiFlow PAS sur nginx_default"
    fi
else
    echo "❌ Réseau nginx_default INEXISTANT"
    echo "Réseaux disponibles:"
    docker network ls
fi

# 6. Vérifier la configuration docker-compose
echo ""
echo "6. CONFIGURATION DOCKER-COMPOSE:"
if [ -f "docker-compose.yml" ]; then
    echo "✅ docker-compose.yml existe"
    echo "Port mapping configuré:"
    grep -A2 -B2 "3000:3000" docker-compose.yml || echo "❌ Mapping 3000:3000 non trouvé"
    echo "Réseau configuré:"
    grep -A5 "networks:" docker-compose.yml || echo "❌ Configuration réseau non trouvée"
else
    echo "❌ docker-compose.yml manquant"
fi

echo ""
echo "🔧 SOLUTIONS RECOMMANDÉES:"
echo ""
echo "SI PORT MAPPING MANQUANT:"
echo "  - Vérifier docker-compose.yml contient: ports: - '3000:3000'"
echo "  - Redémarrer: docker-compose restart logiflow-app"
echo ""
echo "SI FIREWALL BLOQUE:"
echo "  - ufw allow 3000"
echo "  - ou: iptables -A INPUT -p tcp --dport 3000 -j ACCEPT"
echo ""
echo "SI RÉSEAU MANQUANT:"
echo "  - docker network create nginx_default"
echo "  - docker-compose restart"
echo ""
echo "ACCÈS DIRECT:"
echo "  - Application accessible directement sur http://localhost:3000"
echo "  - Pas besoin de nginx ou reverse proxy"