-- SCRIPT DE VÉRIFICATION COMPLÈTE DU SCHÉMA
-- =========================================

\echo '========================================'
\echo 'VÉRIFICATION COMPLÈTE DE LA BASE'
\echo '========================================'
\echo ''

-- 1. VÉRIFIER TOUTES LES COLONNES CRITIQUES
\echo '1. COLONNES CRITIQUES'
\echo '--------------------'
WITH required_columns AS (
    SELECT 'orders' as table_name, 'notes' as column_name, 'text' as expected_type
    UNION ALL SELECT 'orders', 'planned_date', 'date'
    UNION ALL SELECT 'orders', 'status', 'character varying'
    UNION ALL SELECT 'orders', 'created_by', 'character varying'
    UNION ALL SELECT 'deliveries', 'scheduled_date', 'date'
    UNION ALL SELECT 'deliveries', 'notes', 'text'
    UNION ALL SELECT 'deliveries', 'status', 'character varying'
    UNION ALL SELECT 'deliveries', 'bl_number', 'character varying'
    UNION ALL SELECT 'deliveries', 'bl_amount', 'numeric'
    UNION ALL SELECT 'users', 'name', 'character varying'
    UNION ALL SELECT 'users', 'username', 'character varying'
    UNION ALL SELECT 'users', 'email', 'character varying'
    UNION ALL SELECT 'users', 'role', 'character varying'
)
SELECT 
    rc.table_name,
    rc.column_name,
    CASE 
        WHEN c.column_name IS NULL THEN '❌ MANQUANT'
        WHEN c.data_type != rc.expected_type THEN '⚠️  TYPE INCORRECT: ' || c.data_type
        ELSE '✅ OK'
    END as status
FROM required_columns rc
LEFT JOIN information_schema.columns c 
    ON c.table_name = rc.table_name 
    AND c.column_name = rc.column_name
ORDER BY rc.table_name, rc.column_name;

\echo ''
\echo '2. COLONNES OBSOLÈTES À SUPPRIMER'
\echo '---------------------------------'
WITH obsolete_columns AS (
    SELECT 'orders' as table_name, 'comments' as column_name
    UNION ALL SELECT 'deliveries', 'comments'
    UNION ALL SELECT 'deliveries', 'planned_date'
)
SELECT 
    oc.table_name,
    oc.column_name,
    CASE 
        WHEN c.column_name IS NULL THEN '✅ Déjà supprimée'
        ELSE '❌ À SUPPRIMER'
    END as status
FROM obsolete_columns oc
LEFT JOIN information_schema.columns c 
    ON c.table_name = oc.table_name 
    AND c.column_name = oc.column_name
WHERE c.column_name IS NOT NULL;

\echo ''
\echo '3. CONTRAINTES DE CLÉ PRIMAIRE'
\echo '------------------------------'
SELECT 
    tc.table_name,
    kcu.column_name,
    tc.constraint_type
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
    AND tc.constraint_type = 'PRIMARY KEY'
    AND tc.table_name IN ('users', 'groups', 'suppliers', 'orders', 'deliveries', 'user_groups')
ORDER BY tc.table_name;

\echo ''
\echo '4. CONTRAINTES DE CLÉ ÉTRANGÈRE'
\echo '-------------------------------'
SELECT 
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_column
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '5. TEST DE CRÉATION'
\echo '-------------------'
\echo 'Test d''insertion dans orders...'
-- Ce test échouera si des colonnes manquent
DO $$
BEGIN
    INSERT INTO orders (supplier_id, group_id, planned_date, status, notes, created_by)
    VALUES (1, 1, CURRENT_DATE, 'test', 'test note', 'test_user');
    
    DELETE FROM orders WHERE created_by = 'test_user';
    
    RAISE NOTICE '✅ Test orders réussi';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test orders échoué: %', SQLERRM;
END $$;

\echo ''
\echo 'Test d''insertion dans deliveries...'
DO $$
BEGIN
    INSERT INTO deliveries (supplier_id, group_id, scheduled_date, quantity, unit, status, notes, created_by)
    VALUES (1, 1, CURRENT_DATE, 10, 'palettes', 'test', 'test note', 'test_user');
    
    DELETE FROM deliveries WHERE created_by = 'test_user';
    
    RAISE NOTICE '✅ Test deliveries réussi';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Test deliveries échoué: %', SQLERRM;
END $$;

\echo ''
\echo '========================================'
\echo 'FIN DE LA VÉRIFICATION'
\echo '========================================'