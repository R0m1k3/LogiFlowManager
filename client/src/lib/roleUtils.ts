// Utilitaire pour harmoniser les couleurs des rôles dans toute l'application

export const ROLE_COLORS = {
  admin: '#dc2626',        // Rouge
  manager: '#2563eb',      // Bleu
  employee: '#16a34a',     // Vert
  directeur: '#9333ea',    // Violet
} as const;

export const ROLE_DISPLAY_NAMES = {
  admin: 'Administrateur',
  manager: 'Manager',
  employee: 'Employé',
  directeur: 'Directeur',
} as const;

export type RoleType = keyof typeof ROLE_COLORS;

export function getRoleColor(roleName: string): string {
  const roleKey = roleName.toLowerCase() as RoleType;
  return ROLE_COLORS[roleKey] || '#666666';
}

export function getRoleDisplayName(roleName: string): string {
  const roleKey = roleName.toLowerCase() as RoleType;
  return ROLE_DISPLAY_NAMES[roleKey] || roleName;
}

// Utilitaire pour les classes Tailwind (pour Users.tsx)
export function getRoleTailwindClasses(roleName: string) {
  switch (roleName.toLowerCase()) {
    case 'admin':
      return {
        badgeClass: 'bg-red-100 text-red-800',
        iconClass: 'text-red-500'
      };
    case 'manager':
      return {
        badgeClass: 'bg-blue-100 text-blue-800',
        iconClass: 'text-blue-500'
      };
    case 'employee':
      return {
        badgeClass: 'bg-green-100 text-green-800',
        iconClass: 'text-green-500'
      };
    case 'directeur':
      return {
        badgeClass: 'bg-purple-100 text-purple-800',
        iconClass: 'text-purple-500'
      };
    default:
      return {
        badgeClass: 'bg-gray-100 text-gray-800',
        iconClass: 'text-gray-500'
      };
  }
}