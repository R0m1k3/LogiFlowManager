#!/bin/bash

echo "🚨 CORRECTION URGENTE PRODUCTION - Schéma customer_orders"
echo "========================================================="

# Vérifier si on est en production Docker
if docker-compose ps | grep -q logiflow; then
    echo "✅ Environnement Docker détecté"
    
    # Exécuter le script SQL de correction
    echo "🔧 Application du correctif schéma..."
    docker-compose exec -T postgres psql -U logiflow_admin -d logiflow_db < fix-customer-orders-schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Correctif schéma appliqué avec succès"
        
        # Redémarrer l'application pour prendre en compte les changements
        echo "🔄 Redémarrage application..."
        docker-compose restart logiflow
        
        echo "⏳ Attente redémarrage..."
        sleep 20
        
        # Test de l'API
        echo "🧪 Test API customer-orders..."
        curl -s http://localhost:3000/api/customer-orders > /dev/null
        if [ $? -eq 0 ]; then
            echo "✅ API customer-orders fonctionnelle"
        else
            echo "❌ API customer-orders toujours non accessible"
        fi
        
    else
        echo "❌ Erreur lors de l'application du correctif"
        exit 1
    fi
    
else
    echo "❌ Environnement Docker non détecté"
    echo "ℹ️  Exécutez manuellement le script SQL fix-customer-orders-schema.sql"
    exit 1
fi

echo ""
echo "🎉 CORRECTION TERMINÉE !"
echo ""
echo "🎯 TESTS À EFFECTUER :"
echo "1. Aller dans Commandes Client"
echo "2. Cliquer sur 'Nouvelle Commande'"
echo "3. Remplir le formulaire et valider"
echo "4. Vérifier que la création fonctionne sans erreur 500"
echo ""
echo "📋 La colonne customer_email est maintenant disponible !"