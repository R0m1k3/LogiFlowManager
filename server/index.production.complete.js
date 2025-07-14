import express from 'express';
import { join, dirname } from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { pool } from './db.production.ts';
import { setupLocalAuth } from './localAuth.production.ts';
import { registerRoutes } from './routes.production.ts';
import { initializeRolesAndPermissions } from './initRolesAndPermissions.production.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Configuration
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

async function startServer() {
  try {
    console.log("🚀 Démarrage LogiFlow Production Complet...");
    
    // Test connexion base de données
    console.log("Test connexion base de données...");
    const client = await pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log("✅ Connexion base de données OK");
    
    // Initialiser rôles et permissions
    console.log("Initialisation rôles et permissions...");
    await initializeRolesAndPermissions();
    console.log("✅ Rôles et permissions initialisés");

    // Configuration authentification
    setupLocalAuth(app);

    // Enregistrer routes API
    await registerRoutes(app);

    // Servir fichiers statiques
    app.use(express.static('dist/public'));

    // Health check
    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: 'production-complete'
      });
    });

    // Route catch-all pour React
    app.get('*', (req, res) => {
      res.sendFile(join(process.cwd(), 'dist/public/index.html'));
    });

    const PORT = process.env.PORT || 3000;

    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ LogiFlow Production Complet lancé sur port ${PORT}`);
      console.log(`🌐 Accès: http://localhost:${PORT}`);
      console.log(`💾 Base de données connectée`);
      console.log(`🔐 Authentification activée`);
      console.log(`📊 Routes API enregistrées`);
    });
  } catch (error) {
    console.error('❌ Erreur démarrage:', error);
    process.exit(1);
  }
}

startServer();