#!/bin/bash

# 🚀 Script de Déploiement Final - LogiFlow Production Docker
# Usage: ./deploy-fix.sh

set -e  # Arrêter en cas d'erreur

echo "🚀 DÉPLOIEMENT LOGIFLOW PRODUCTION"
echo "=================================="

# Variables
COMPOSE_FILE="docker-compose.production.yml"
APP_PORT="8080"
DB_PORT="5434"

# Fonction de log
log() {
    echo "$(date '+%H:%M:%S') [INFO] $1"
}

error() {
    echo "$(date '+%H:%M:%S') [ERROR] $1" >&2
}

# Vérifier que Docker est installé
if ! command -v docker &> /dev/null; then
    error "Docker n'est pas installé"
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    error "Docker Compose n'est pas installé"
    exit 1
fi

# Vérifier que le fichier compose existe
if [ ! -f "$COMPOSE_FILE" ]; then
    error "Fichier $COMPOSE_FILE introuvable"
    exit 1
fi

log "Vérification des prérequis... ✅"

# 1. Nettoyage complet
log "1. Arrêt et nettoyage des conteneurs existants..."
docker-compose -f "$COMPOSE_FILE" down -v 2>/dev/null || true

# Nettoyer les images orphelines
log "Nettoyage des ressources Docker..."
docker system prune -f

log "Nettoyage terminé ✅"

# 2. Construction
log "2. Construction des images Docker..."
docker-compose -f "$COMPOSE_FILE" build --no-cache

log "Construction terminée ✅"

# 3. Démarrage
log "3. Démarrage des services..."
docker-compose -f "$COMPOSE_FILE" up -d

log "Services démarrés ✅"

# 4. Attente de l'initialisation
log "4. Attente de l'initialisation (45 secondes)..."
sleep 45

# 5. Vérifications
log "5. Vérification du déploiement..."

# Vérifier que les conteneurs tournent
if ! docker ps | grep -q "logiflow-app"; then
    error "Le conteneur logiflow-app ne fonctionne pas"
    docker logs logiflow-app --tail 20
    exit 1
fi

if ! docker ps | grep -q "logiflow-postgres"; then
    error "Le conteneur logiflow-postgres ne fonctionne pas"
    docker logs logiflow-postgres --tail 20
    exit 1
fi

log "Conteneurs actifs ✅"

# Vérifier les ports
APP_PORT_CHECK=$(docker port logiflow-app | grep "5000/tcp" | cut -d: -f2 || echo "")
if [ "$APP_PORT_CHECK" != "$APP_PORT" ]; then
    error "Port $APP_PORT non exposé correctement"
    docker port logiflow-app
    exit 1
fi

log "Ports configurés correctement ✅"

# Test de l'API
log "Test de l'API..."
if curl -s -f "http://localhost:$APP_PORT/api/health" > /dev/null; then
    log "API accessible ✅"
    API_RESPONSE=$(curl -s "http://localhost:$APP_PORT/api/health" | jq -r '.status' 2>/dev/null || echo "error")
    if [ "$API_RESPONSE" = "healthy" ]; then
        log "API répond correctement ✅"
    else
        error "API ne répond pas correctement: $API_RESPONSE"
    fi
else
    error "API non accessible sur le port $APP_PORT"
    curl -v "http://localhost:$APP_PORT/api/health" || true
    exit 1
fi

# Test de la base de données
log "Test de la base de données..."
DB_RESPONSE=$(curl -s "http://localhost:$APP_PORT/api/debug/db" | jq -r '.connected' 2>/dev/null || echo "false")
if [ "$DB_RESPONSE" = "true" ]; then
    log "Base de données connectée ✅"
else
    error "Problème de connexion à la base de données"
    curl -s "http://localhost:$APP_PORT/api/debug/db" | jq . || true
fi

# 6. Informations finales
log "6. Informations de déploiement..."

echo ""
echo "🎉 DÉPLOIEMENT RÉUSSI !"
echo "======================"
echo ""
echo "📊 Informations d'accès :"
echo "  • Application : http://localhost:$APP_PORT"
echo "  • API Health  : http://localhost:$APP_PORT/api/health"
echo "  • Debug Status: http://localhost:$APP_PORT/api/debug/status"
echo "  • PostgreSQL  : localhost:$DB_PORT"
echo ""
echo "👤 Authentification :"
echo "  • Utilisateur : admin"
echo "  • Mot de passe: admin"
echo ""
echo "🐳 Conteneurs Docker :"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep logiflow || true
echo ""
echo "📋 Logs en temps réel :"
echo "  docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo "🔧 Configuration Nginx :"
echo "  Pointez votre reverse proxy vers: http://localhost:$APP_PORT"
echo ""

# 7. Test optionnel avec navigateur
if command -v xdg-open &> /dev/null; then
    read -p "Ouvrir l'application dans le navigateur ? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        xdg-open "http://localhost:$APP_PORT"
    fi
fi

log "Script de déploiement terminé avec succès !"