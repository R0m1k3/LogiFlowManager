-- 🚨 CORRECTION URGENTE PRODUCTION - Colonne customer_email manquante
-- Exécuter ce script en production pour corriger l'erreur de création commandes client

-- 1. Vérifier la structure actuelle
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'customer_orders' 
ORDER BY ordinal_position;

-- 2. Ajouter la colonne customer_email si elle n'existe pas
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'customer_orders' 
        AND column_name = 'customer_email'
    ) THEN
        ALTER TABLE customer_orders ADD COLUMN customer_email VARCHAR(255);
        RAISE NOTICE 'Colonne customer_email ajoutée avec succès';
    ELSE
        RAISE NOTICE 'Colonne customer_email existe déjà';
    END IF;
END $$;

-- 3. Vérifier que toutes les colonnes requises existent
SELECT 
    CASE 
        WHEN COUNT(*) = 18 THEN 'SCHEMA OK - Toutes colonnes présentes'
        ELSE CONCAT('SCHEMA INCOMPLET - ', COUNT(*), ' colonnes sur 18 attendues')
    END as status
FROM information_schema.columns 
WHERE table_name = 'customer_orders' 
AND column_name IN (
    'id', 'order_taker', 'customer_name', 'customer_phone', 'customer_email',
    'product_designation', 'product_reference', 'gencode', 'quantity',
    'supplier_id', 'status', 'deposit', 'is_promotional_price',
    'customer_notified', 'group_id', 'created_by', 'created_at', 'updated_at'
);

-- 4. Afficher la structure finale
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'customer_orders' 
ORDER BY ordinal_position;