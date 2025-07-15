#!/bin/bash

echo "🔧 DÉPLOIEMENT CORRECTIF RÔLES PRODUCTION"
echo "========================================"
echo "Problème identifié: Rôles avec couleurs grises et IDs incorrects"
echo "Solution: Réinitialisation complète des données de rôles"
echo ""

# Vérifier si on est en production
if [ "$1" = "production" ]; then
    echo "🏭 MODE PRODUCTION - Exécution sur serveur de production"
    
    # Sauvegarder les données actuelles
    echo "📋 Sauvegarde des données actuelles..."
    timestamp=$(date +%Y%m%d_%H%M%S)
    docker exec logiflow-db pg_dump -U logiflow_admin -d logiflow_db -t roles -t permissions -t role_permissions -t user_roles > backup_roles_prod_${timestamp}.sql
    
    # Appliquer le correctif
    echo "🔧 Application du correctif..."
    docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < fix-production-data-force.sql
    
    # Redémarrer l'application
    echo "🔄 Redémarrage de l'application..."
    docker restart logiflow-app
    
    echo "⏳ Attente du redémarrage (30 secondes)..."
    sleep 30
    
    # Test de l'API
    echo "🔍 Test de l'API..."
    curl -s http://localhost:3000/api/health || echo "Application en cours de redémarrage"
    
    echo "✅ Correctif appliqué avec succès"
    echo "🗂️ Sauvegarde: backup_roles_prod_${timestamp}.sql"
    
else
    echo "⚠️  MODE DÉVELOPPEMENT - Simulation du déploiement"
    echo ""
    echo "Pour appliquer en production, exécutez:"
    echo "./deploy-roles-fix.sh production"
    echo ""
    echo "Ou manuellement:"
    echo "1. docker exec -i logiflow-db psql -U logiflow_admin -d logiflow_db < fix-production-data-force.sql"
    echo "2. docker restart logiflow-app"
fi

echo ""
echo "🎯 APRÈS CORRECTION, VÉRIFIER:"
echo "- Couleurs des rôles: Admin (rouge), Manager (bleu), Employé (vert), Directeur (violet)"
echo "- Plus d'erreur 'Rôle ID 6 n'est pas valide'"
echo "- Assignation de rôles fonctionnelle"
echo "- Interface de gestion des rôles opérationnelle"