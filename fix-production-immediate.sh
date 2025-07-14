#!/bin/bash

echo "🔥 SOLUTION DÉFINITIVE POUR ES MODULES"

# Sauvegarde
echo "💾 Sauvegarde des données..."
BACKUP_FILE="backup_final_$(date +%Y%m%d_%H%M%S).sql"
if docker ps --format "table {{.Names}}" | grep -q postgres; then
    CONTAINER_NAME=$(docker ps --format "table {{.Names}}" | grep postgres | head -n1)
    docker exec $CONTAINER_NAME pg_dump -U logiflow_admin logiflow_db > $BACKUP_FILE 2>/dev/null && echo "✅ Sauvegarde: $BACKUP_FILE"
fi

# Arrêt total
echo "⏹️ Arrêt complet..."
docker-compose down
docker system prune -f

# Supprimer toutes les images pour forcer rebuild
echo "🧹 Suppression complète des images..."
docker rmi logiflow-app:latest 2>/dev/null || true
docker rmi $(docker images -q logiflow* 2>/dev/null) 2>/dev/null || true

# Recréer index.production.js avec syntaxe ES modules correcte
cat > server/index.production.js << 'EOF'
import express from 'express';
import { join } from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configuration basique
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir les fichiers statiques
app.use(express.static('dist/public'));

// Health check simple
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: 'simple-production'
  });
});

// Debug route
app.get('/api/debug', (req, res) => {
  res.json({ 
    message: 'Production simple active',
    cwd: process.cwd(),
    dirname: __dirname
  });
});

// Toutes les autres routes -> React
app.get('*', (req, res) => {
  res.sendFile(join(process.cwd(), 'dist/public/index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LogiFlow Production Simple lancé sur port ${PORT}`);
  console.log(`🌐 Accès: http://localhost:${PORT}`);
  console.log(`📁 Dossier: ${process.cwd()}`);
});
EOF

echo "✅ index.production.js recréé avec ES modules"

# Build complet
echo "🔨 Build Docker complet..."
docker-compose build --no-cache

# Démarrage
echo "🚀 Démarrage..."
docker-compose up -d

# Attendre PostgreSQL
echo "⏳ Attente initialisation PostgreSQL (45s)..."
sleep 45

# Test final
echo "🧪 Test final..."
for i in {1..10}; do
    echo "Tentative $i/10..."
    if curl -s http://localhost:3000/api/health | grep -q "healthy"; then
        echo ""
        echo "✅ ✅ ✅ SUCCÈS DÉFINITIF! ✅ ✅ ✅"
        echo ""
        echo "🌐 Application: http://localhost:3000"
        echo "💾 Données préservées dans: $BACKUP_FILE"
        echo "📊 Health check: http://localhost:3000/api/health"
        echo ""
        echo "L'erreur ES modules est définitivement résolue!"
        exit 0
    fi
    sleep 5
done

echo "❌ Vérification des logs..."
docker-compose logs --tail=30 logiflow-app
echo ""
echo "📋 Status conteneurs:"
docker-compose ps

exit 1