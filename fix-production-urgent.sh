#!/bin/bash

echo "🚨 CORRECTION URGENTE NAVIGATION PRODUCTION"
echo "==========================================="
echo ""

echo "1. Mise à jour du fichier de production avec correction routing..."

# Créer un fichier temporaire avec les corrections
cat > temp_index_production.ts << 'EOF'
import express, { type Request, Response, NextFunction } from "express";
import { setupSecurityHeaders, setupRateLimiting, setupInputSanitization } from "./security";
import { setupCompression } from "./cache";
import { monitor, setupMonitoringEndpoints } from "./monitoring";
import { initDatabase } from "./initDatabase.production";
import path from "path";
import fs from "fs";

const app = express();

// Configuration trust proxy sécurisée pour Docker
// Faire confiance seulement au premier proxy (Docker/nginx)
app.set('trust proxy', 1);

// Fonction de log pour la production
function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

// Fonction pour servir les fichiers statiques en production
function serveStatic(app: express.Express) {
  // Essayer plusieurs chemins possibles pour le build frontend
  const possiblePaths = [
    path.resolve("dist", "public"),
    path.resolve("dist"),
    path.resolve(".", "dist", "public"),
  ];
  
  let distPath = null;
  for (const testPath of possiblePaths) {
    if (fs.existsSync(testPath) && fs.existsSync(path.join(testPath, "index.html"))) {
      distPath = testPath;
      break;
    }
  }

  if (!distPath) {
    console.log("Available directories:");
    console.log("- dist/:", fs.existsSync("dist") ? fs.readdirSync("dist") : "NOT FOUND");
    console.log("- dist/public/:", fs.existsSync("dist/public") ? fs.readdirSync("dist/public") : "NOT FOUND");
    
    throw new Error(
      `Could not find the build directory with index.html. Checked: ${possiblePaths.join(", ")}`,
    );
  }

  console.log(`✅ Serving static files from: ${distPath}`);
  app.use(express.static(distPath));

  // fall through to index.html if the file doesn't exist (seulement pour les routes non-API)
  app.get("*", (req, res) => {
    // Ne pas rediriger les routes API vers index.html
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ message: 'API route not found' });
    }
    
    // Log pour debug du routing
    console.log(`📍 Serving index.html for path: ${req.path}`);
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}

// Sécurité et optimisation
setupSecurityHeaders(app);
setupRateLimiting(app);
setupInputSanitization(app);
setupCompression(app);

// Monitoring des performances
app.use(monitor.middleware());
setupMonitoringEndpoints(app);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Logging optimisé (sans détails de réponse sensibles)
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      // Logging sécurisé sans données sensibles
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      
      // Ne pas logger les données sensibles
      if (path.includes('/login') || path.includes('/password')) {
        logLine += ' :: [SENSITIVE DATA HIDDEN]';
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialiser la base de données en premier
  try {
    await initDatabase();
  } catch (error) {
    console.error('❌ Failed to initialize database:', error);
    process.exit(1);
  }

  const { registerRoutes } = await import('./routes.production');
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // En production, servir les fichiers statiques uniquement
  serveStatic(app);

  // Port configuré pour la production
  const port = process.env.PORT || 3000;
  server.listen({
    port,
    host: "0.0.0.0",
  }, () => {
    log(`Server running on port ${port}`);
  });
})();
EOF

# Remplacer le fichier
mv temp_index_production.ts server/index.production.ts

echo "✅ Fichier server/index.production.ts mis à jour avec corrections routing"
echo ""

echo "2. Création script de test navigation..."

cat > test-navigation-production.sh << 'EOF'
#!/bin/bash

echo "🧪 TEST NAVIGATION PRODUCTION"
echo "============================="
echo ""

echo "1. Test authentification..."
response=$(curl -s -w "HTTP:%{http_code}" -X POST http://localhost:3000/api/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"admin"}' \
  -c /tmp/nav-cookies.txt)

http_code="${response##*HTTP:}"

if [ "$http_code" = "200" ]; then
    echo "✅ Authentification réussie"
    
    echo ""
    echo "2. Test récupération utilisateur..."
    user_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/api/user \
      -b /tmp/nav-cookies.txt)
    
    user_http_code="${user_response##*HTTP:}"
    
    if [ "$user_http_code" = "200" ]; then
        echo "✅ Utilisateur récupéré"
        
        echo ""
        echo "3. Test accès aux pages frontend..."
        
        echo "Test /dashboard:"
        dashboard_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/dashboard \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $dashboard_response"
        
        echo "Test /calendar:"
        calendar_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/calendar \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $calendar_response"
        
        echo "Test /orders:"
        orders_response=$(curl -s -w "HTTP:%{http_code}" -X GET http://localhost:3000/orders \
          -b /tmp/nav-cookies.txt | tail -1)
        echo "Code: $orders_response"
        
    else
        echo "❌ Problème récupération utilisateur: $user_http_code"
    fi
else
    echo "❌ Problème authentification: $http_code"
fi

rm -f /tmp/nav-cookies.txt
EOF

chmod +x test-navigation-production.sh

echo "✅ Script test-navigation-production.sh créé"
echo ""

echo "3. Copie vers production et redémarrage..."

# Simulation de copie vers production
echo "📋 Fichiers prêts pour production :"
echo "   - server/index.production.ts (corrigé)"
echo "   - test-navigation-production.sh (nouveau)"
echo ""

echo "🚀 CORRECTIONS APPLIQUÉES :"
echo "✅ Routing serveur corrigé (app.get au lieu de app.use)"
echo "✅ Séparation routes API vs frontend"
echo "✅ Logs de debug pour identifier les problèmes"
echo "✅ Script de test navigation créé"
echo ""

echo "PROCHAINES ÉTAPES :"
echo "1. Copier server/index.production.ts vers la production"
echo "2. Redémarrer l'application en production"
echo "3. Tester avec ./test-navigation-production.sh"
echo "4. Vérifier les logs pour voir les redirections"
echo ""

echo "Le problème de navigation devrait être résolu maintenant !"