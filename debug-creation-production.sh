#!/bin/bash

echo "🔧 DIAGNOSTIC CRÉATION GROUPES/FOURNISSEURS PRODUCTION"
echo "===================================================="
echo ""

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📊 Étape 1: État de l'application${NC}"
echo "1. Vérifier que l'application fonctionne"
echo "2. Tester la création de groupe avec logs détaillés"
echo "3. Tester la création de fournisseur avec logs détaillés"
echo ""

echo -e "${BLUE}📋 Instructions de test:${NC}"
echo ""
echo -e "${YELLOW}TEST 1 - CRÉATION DE GROUPE:${NC}"
echo "1. Aller sur: Gestion des Groupes/Magasins"
echo "2. Cliquer: Nouveau Groupe"
echo "3. Remplir:"
echo "   - Nom: Test Debug Production"
echo "   - Couleur: #FF5722"
echo "4. Cliquer: Créer le groupe"
echo ""
echo -e "${YELLOW}TEST 2 - CRÉATION DE FOURNISSEUR:${NC}"
echo "1. Aller sur: Fournisseurs"
echo "2. Cliquer: Nouveau Fournisseur"
echo "3. Remplir:"
echo "   - Nom: Test Fournisseur Debug"
echo "   - Contact: Test Contact"
echo "   - Téléphone: 0123456789"
echo "4. Cliquer: Créer le fournisseur"
echo ""

echo -e "${BLUE}📨 Les logs doivent montrer:${NC}"
echo ""
echo -e "${GREEN}POUR CHAQUE CRÉATION:${NC}"
echo "✅ 📨 Request headers avec content-type: application/json"
echo "✅ 📋 Request body avec les vraies données"
echo "✅ 🔐 User ID détecté (Replit Auth ou Local)"
echo "✅ 🔐 User requesting creation: [USER_ID]"
echo "✅ ✅ User found: {username, role}"
echo "✅ ✅ User has permission to create"
echo "✅ 🔍 Validating data with schema..."
echo "✅ ✅ Data validation passed"
echo "✅ 🏪/🚚 Creating in database..."
echo "✅ ✅ Creation successful: {id, name}"
echo ""
echo -e "${RED}EN CAS D'ERREUR:${NC}"
echo "❌ Details de l'erreur avec stack trace"
echo "❌ ValidationError avec détails Zod si validation échoue"
echo "❌ User authentication failed si problème auth"
echo "❌ Insufficient permissions si problème de rôle"
echo ""

echo -e "${BLUE}🔍 Vérification des logs:${NC}"
echo "Les logs de debug apparaissent maintenant dans:"
echo "1. Console du navigateur (F12 > Console)"
echo "2. Logs serveur/workflow"
echo "3. Logs Docker en production: docker logs logiflow-app"
echo ""

echo -e "${YELLOW}⚠️  Si l'erreur persiste après ce diagnostic:${NC}"
echo "1. Copier les logs complets"
echo "2. Identifier la ligne exacte de l'erreur"
echo "3. Vérifier si c'est un problème d'authentification, validation, ou base de données"
echo ""

echo -e "${GREEN}✅ Diagnostic configuré avec succès${NC}"
echo "Les routes POST /api/groups et POST /api/suppliers ont maintenant des logs détaillés"
echo ""
echo "$(date '+%H:%M:%S') - Prêt pour le test de création en production"