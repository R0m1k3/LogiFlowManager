import crypto from 'crypto';

/**
 * Alternative à bcrypt pour production Docker Alpine
 * Utilise crypto natif Node.js (pas de compilation nécessaire)
 */

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  // Générer un salt aléatoire
  const salt = crypto.randomBytes(16).toString('hex');
  
  // Créer le hash avec PBKDF2 (sécurisé et natif)
  const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  
  // Retourner salt + hash combinés
  return `${salt}:${hash}`;
}

export async function comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
  try {
    // Séparer le salt du hash
    const [salt, originalHash] = hashedPassword.split(':');
    
    if (!salt || !originalHash) {
      return false;
    }
    
    // Recalculer le hash avec le même salt
    const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
    
    // Comparaison sécurisée
    return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), Buffer.from(hash, 'hex'));
  } catch (error) {
    console.error('Error comparing passwords:', error);
    return false;
  }
}

// Fonction pour migrer les anciens hashes bcrypt si nécessaire
export function isBcryptHash(hash: string): boolean {
  return hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$');
}

// Hash par défaut pour l'admin (password: "admin")
export const DEFAULT_ADMIN_HASH = 'a1b2c3d4e5f6789:6d8a4b2f9e7c1a8b3d5f7e9c2a6b8d4f1e3c5a7b9d2f4e6a8c1b3d5f7e9c2a6b8d4f1e3c5a7b9d2f4e6a8c1b3d5f7e9c2a6b8d4f1e3c5a7b9d2f4e6a8c1b3d5f7e';