import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, Plus, Lock } from "lucide-react";
import type { RoleWithPermissions } from "@shared/schema";

export default function RoleManagementTest() {
  const { user } = useAuth();

  console.log("RoleManagementTest: user:", user);

  // Redirect if not admin
  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <Lock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h3>
              <p className="text-gray-600">Cette page est réservée aux administrateurs.</p>
              <p className="text-sm text-gray-500 mt-2">Rôle actuel: {user?.role || 'Non défini'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Queries
  const { data: roles = [], isLoading: rolesLoading, error: rolesError } = useQuery<RoleWithPermissions[]>({
    queryKey: ['/api/roles'],
  });

  const { data: permissions = [], isLoading: permissionsLoading, error: permissionsError } = useQuery({
    queryKey: ['/api/permissions'],
  });

  console.log("RoleManagementTest: roles:", roles);
  console.log("RoleManagementTest: permissions:", permissions);
  console.log("RoleManagementTest: rolesError:", rolesError);
  console.log("RoleManagementTest: permissionsError:", permissionsError);

  if (rolesLoading || permissionsLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-300 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-gray-300 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (rolesError) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-red-600 mb-2">Erreur de chargement</h3>
              <p className="text-gray-600">Impossible de charger les rôles</p>
              <pre className="text-xs bg-gray-100 p-2 mt-2 rounded">
                {JSON.stringify(rolesError, null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Rôles (Test)</h1>
          <p className="text-gray-600">Version simplifiée pour débogage</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Rôle
        </Button>
      </div>

      {/* Debug Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de débogage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p><strong>Utilisateur:</strong> {user?.username} ({user?.role})</p>
            <p><strong>Nombre de rôles:</strong> {roles.length}</p>
            <p><strong>Nombre de permissions:</strong> {permissions.length}</p>
            <p><strong>Erreur rôles:</strong> {rolesError ? 'Oui' : 'Non'}</p>
            <p><strong>Erreur permissions:</strong> {permissionsError ? 'Oui' : 'Non'}</p>
          </div>
        </CardContent>
      </Card>

      {/* Roles List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {roles.map((role) => (
          <Card key={role.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-blue-600" />
                <div>
                  <CardTitle className="text-lg">{role.displayName || role.name}</CardTitle>
                  <p className="text-sm text-gray-500">{role.name}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-2">{role.description}</p>
              <p className="text-xs text-gray-500">
                {role.rolePermissions?.length || 0} permission(s)
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {roles.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun rôle trouvé</h3>
              <p className="text-gray-600">Les rôles n'ont pas été chargés correctement.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}