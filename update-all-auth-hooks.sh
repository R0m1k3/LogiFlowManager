#!/bin/bash

echo "🔧 CORRECTION MASSIVE DE TOUS LES HOOKS useAuth"
echo "=============================================="
echo ""

# Liste des fichiers à corriger
files=(
    "client/src/components/modals/EditOrderModal.tsx"
    "client/src/components/modals/CreateOrderModal.tsx"
    "client/src/components/modals/CreateDeliveryModal.tsx"
    "client/src/components/modals/OrderDetailModal.tsx"
    "client/src/components/modals/EditDeliveryModal.tsx"
    "client/src/components/StatsPanel.tsx"
    "client/src/components/CustomerOrderForm.tsx"
    "client/src/components/Layout.tsx"
    "client/src/pages/Orders.tsx"
    "client/src/pages/AuthPage.tsx"
    "client/src/pages/Suppliers.tsx"
    "client/src/pages/Users.tsx"
    "client/src/pages/Groups.tsx"
    "client/src/pages/Deliveries.tsx"
    "client/src/pages/NocoDBConfig.tsx"
    "client/src/pages/Publicities.tsx"
    "client/src/pages/RoleManagement.tsx"
    "client/src/pages/CustomerOrders.tsx"
    "client/src/pages/BLReconciliation.tsx"
)

echo "Correction des imports useAuth -> useAuthUnified..."
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Correction: $file"
        
        # Corriger l'import
        sed -i 's/import { useAuth }/import { useAuthUnified }/g' "$file"
        sed -i 's/from "@\/hooks\/useAuth"/from "@\/hooks\/useAuthUnified"/g' "$file"
        
        # Corriger l'usage du hook
        sed -i 's/useAuth()/useAuthUnified()/g' "$file"
        
        echo "  ✅ Corrigé"
    else
        echo "  ⚠️  Fichier non trouvé: $file"
    fi
done

echo ""
echo "CORRECTION TERMINÉE !"
echo ""
echo "Tous les composants utilisent maintenant useAuthUnified"
echo "qui s'adapte automatiquement entre dev et production."
echo ""