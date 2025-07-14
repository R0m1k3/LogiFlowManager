import express from 'express';
import { join } from 'path';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const server = createServer(app);

// Simple production server without bcrypt
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files
app.use(express.static('dist/public'));

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Catch all for React app
app.get('*', (req, res) => {
  res.sendFile(join(process.cwd(), 'dist/public/index.html'));
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ LogiFlow Production Server running on port ${PORT}`);
  console.log(`🌐 Access at: http://localhost:${PORT}`);
});