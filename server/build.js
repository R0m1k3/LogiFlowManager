// Build script pour production
import esbuild from 'esbuild';

const isProduction = process.env.NODE_ENV === 'production';

await esbuild.build({
  entryPoints: ['server/index.production.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outdir: 'dist',
  external: [
    // Modules externes à ne pas bundler
    'pg-native',
    'cpu-features',
    '@neondatabase/serverless',
    'drizzle-orm',
    'express',
    'passport',
    'passport-local',
    'bcrypt',
    'express-session',
    'connect-pg-simple',
    'zod',
    'drizzle-zod',
    'nanoid',
    'memoizee',
    'date-fns',
    // Patterns pour modules de dev à exclure
    'vite*',
    'tsx*',
    '@types/*',
    'tailwindcss*',
    '@tailwindcss/*',
    'autoprefixer*',
    'postcss*',
    'typescript*',
    'drizzle-kit*',
    '@replit/*',
    '@vitejs/*',
    'esbuild'
  ],
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  }
}).catch(() => process.exit(1));

console.log('✅ Server build completed');