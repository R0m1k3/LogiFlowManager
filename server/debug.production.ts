import { Express } from "express";

export function setupDebugRoutes(app: Express) {
  console.log("🔧 Setting up debug routes for production troubleshooting...");
  
  // Debug route to check server status
  app.get('/api/debug/status', (req, res) => {
    res.json({
      status: 'running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      port: process.env.PORT || 5000,
      headers: req.headers,
      ip: req.ip || req.socket.remoteAddress,
      protocol: req.protocol,
      hostname: req.hostname,
      originalUrl: req.originalUrl,
      memory: {
        heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + 'MB',
        heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + 'MB'
      },
      uptime: Math.round(process.uptime()) + ' seconds'
    });
  });
  
  // Debug route to test connectivity
  app.get('/api/debug/echo', (req, res) => {
    console.log('📥 Echo request received:', {
      method: req.method,
      url: req.url,
      headers: req.headers,
      query: req.query
    });
    
    res.json({
      echo: 'success',
      received: {
        headers: req.headers,
        query: req.query,
        body: req.body
      }
    });
  });
  
  // Debug route to check database connection
  app.get('/api/debug/db', async (req, res) => {
    try {
      const { db } = await import('./db.production');
      const result = await db.execute('SELECT NOW() as now, version() as version');
      res.json({
        connected: true,
        timestamp: result.rows[0].now,
        version: result.rows[0].version
      });
    } catch (error) {
      console.error('Database debug error:', error);
      res.status(500).json({
        connected: false,
        error: error.message
      });
    }
  });
  
  console.log("✅ Debug routes configured: /api/debug/status, /api/debug/echo, /api/debug/db");
}