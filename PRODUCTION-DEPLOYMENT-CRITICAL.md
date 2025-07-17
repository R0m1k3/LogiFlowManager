# 🚨 DÉPLOIEMENT PRODUCTION CRITIQUE

## **MODIFICATIONS À APPLIQUER EN PRODUCTION**

### **1. Code-Barres EAN13 Scannable**
- ✅ **Bibliothèque jsbarcode** : Installée en développement
- ⚠️ **REQUIS EN PRODUCTION** : `npm install jsbarcode` sur serveur production
- ✅ **Générateur amélioré** : Utilise jsbarcode pour codes-barres scannables
- ✅ **Fallback sécurisé** : Pattern de secours si jsbarcode indisponible

### **2. Améliorations Étiquettes**
- ✅ **Acompte affiché** : Format monétaire avec emoji 💰
- ✅ **Prix promotionnel** : Badge "PRIX PUBLICITÉ" avec 🏷️
- ✅ **Code-barres professionnel** : Format image EAN13 standard

### **3. Corrections API Format**
- ✅ **statusMutation corrigé** : apiRequest(url, 'PUT', {status})
- ✅ **notificationMutation corrigé** : apiRequest(url, 'PUT', {customerNotified})
- ✅ **deleteMutation corrigé** : apiRequest(url, 'DELETE')

## **COMMANDES DE DÉPLOIEMENT PRODUCTION**

### **1. Installation Dépendance**
```bash
# Sur serveur production
npm install jsbarcode
```

### **2. Rebuild Application**
```bash
# Rebuild pour intégrer les modifications
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### **3. Vérification**
- ✅ Test impression étiquette commande #4
- ✅ Vérification code-barres scannable
- ✅ Test changement statut commandes client

## **IMPACT CRITIQUE**

**SANS DÉPLOIEMENT** :
- ❌ Codes-barres non scannables (fallback basique)
- ❌ Changement statut commandes non fonctionnel
- ❌ Notifications client bloquées

**AVEC DÉPLOIEMENT** :
- ✅ Codes-barres EAN13 scannables professionnels
- ✅ Toutes mutations commandes client fonctionnelles
- ✅ Étiquettes complètes avec acompte et prix promo

## **PRIORITÉ ABSOLUE**

Ces modifications DOIVENT être déployées en production pour :
1. **Fonctionnalité critique** : Changement statut commandes client
2. **Qualité professionnelle** : Codes-barres scannables
3. **Complétude information** : Acomptes et prix promotionnels visibles

**Le déploiement est OBLIGATOIRE pour la fonctionnalité complète !**