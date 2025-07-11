-- Script pour corriger les années des publicités basées sur leur date de début
-- Et mise à jour de l'interface pour afficher les bonnes années

-- 1. Mettre à jour les années basées sur les dates de début
UPDATE publicities 
SET year = EXTRACT(YEAR FROM start_date)
WHERE year != EXTRACT(YEAR FROM start_date);

-- 2. Vérifier les résultats
SELECT 
  id, 
  pub_number, 
  start_date, 
  end_date, 
  year as current_year,
  EXTRACT(YEAR FROM start_date) as calculated_year
FROM publicities 
ORDER BY start_date;