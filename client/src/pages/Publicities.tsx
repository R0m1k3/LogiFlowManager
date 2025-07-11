import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Calendar, Edit, Trash2, Eye, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useStore } from "@/components/Layout";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import type { PublicityWithRelations, Group } from "@shared/schema";
import PublicityForm from "@/components/PublicityForm";

export default function Publicities() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear()); // Année courante par défaut
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedPublicity, setSelectedPublicity] = useState<PublicityWithRelations | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const { user } = useAuth();
  const { selectedStoreId } = useStore();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Seuls les admins peuvent modifier/supprimer
  const canModify = user?.role === 'admin';

  // Generate year options (current year ± 5 years)
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const { data: publicities = [], isLoading } = useQuery({
    queryKey: ['/api/publicities', selectedYear, selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append('year', selectedYear.toString());
      if (selectedStoreId) {
        params.append('storeId', selectedStoreId.toString());
      }
      const response = await fetch(`/api/publicities?${params}`);
      return response.json();
    },
  });

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ['/api/groups'],
    enabled: !!user,
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/publicities/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la suppression');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/publicities'] });
      toast({ description: "Publicité supprimée avec succès" });
      setIsDeleteModalOpen(false);
      setSelectedPublicity(null);
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Erreur lors de la suppression" 
      });
    }
  });

  const handleView = (publicity: PublicityWithRelations) => {
    setSelectedPublicity(publicity);
    setIsViewModalOpen(true);
  };

  const handleEdit = (publicity: PublicityWithRelations) => {
    setSelectedPublicity(publicity);
    setIsEditModalOpen(true);
  };

  const handleDelete = (publicity: PublicityWithRelations) => {
    setSelectedPublicity(publicity);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (selectedPublicity) {
      deleteMutation.mutate(selectedPublicity.id);
    }
  };

  const closeModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsViewModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedPublicity(null);
  };

  const canCreateOrEdit = user?.role === 'admin' || user?.role === 'manager';
  const canDelete = user?.role === 'admin';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Publicités</h1>
          <p className="text-gray-600">Gestion des campagnes publicitaires</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Year Filter */}
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500" />
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {canModify && (
            <Button onClick={() => setIsCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nouvelle publicité
            </Button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total {selectedYear}</p>
                <p className="text-2xl font-semibold">{publicities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Calendar className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">En cours</p>
                <p className="text-2xl font-semibold">
                  {publicities.filter(p => {
                    const now = new Date();
                    const start = new Date(p.startDate);
                    const end = new Date(p.endDate);
                    return start <= now && now <= end;
                  }).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">À venir</p>
                <p className="text-2xl font-semibold">
                  {publicities.filter(p => new Date(p.startDate) > new Date()).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Publicities List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : publicities.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Aucune publicité pour {selectedYear}
            </h3>
            <p className="text-gray-600 mb-6">
              Commencez par créer votre première campagne publicitaire.
            </p>
            {canCreateOrEdit && (
              <Button onClick={() => setIsCreateModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Créer une publicité
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      N° PUB
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Désignation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Période
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Magasins
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Créé par
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {publicities
                    .sort((a, b) => a.pubNumber.localeCompare(b.pubNumber))
                    .map((publicity) => {
                      const now = new Date();
                      const start = new Date(publicity.startDate);
                      const end = new Date(publicity.endDate);
                      const isActive = start <= now && now <= end;
                      const isUpcoming = start > now;
                      const isPast = end < now;

                      return (
                        <tr key={publicity.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {publicity.pubNumber}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900 max-w-xs truncate">
                              {publicity.designation}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {format(new Date(publicity.startDate), "dd/MM/yy", { locale: fr })} - {format(new Date(publicity.endDate), "dd/MM/yy", { locale: fr })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {isActive && <Badge className="bg-green-100 text-green-800">En cours</Badge>}
                            {isUpcoming && <Badge className="bg-blue-100 text-blue-800">À venir</Badge>}
                            {isPast && <Badge variant="secondary">Terminée</Badge>}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {publicity.participations.length === 0 ? (
                                <Badge className="text-xs bg-red-100 text-red-800 hover:bg-red-100">
                                  Aucun magasin
                                </Badge>
                              ) : (
                                <>
                                  {publicity.participations.slice(0, 2).map((participation) => (
                                    <Badge key={participation.groupId} variant="outline" className="text-xs">
                                      <div 
                                        className="w-2 h-2 rounded-full mr-1" 
                                        style={{ backgroundColor: participation.group.color }}
                                      />
                                      {participation.group.name}
                                    </Badge>
                                  ))}
                                  {publicity.participations.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{publicity.participations.length - 2}
                                    </Badge>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-600">
                              {publicity.creator.name || publicity.creator.username}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleView(publicity)}
                                title="Voir les détails"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              
                              {canModify && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(publicity)}
                                    title="Modifier"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(publicity)}
                                    className="text-red-600 hover:text-red-700"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Créer une nouvelle publicité</DialogTitle>
            <DialogDescription>
              Remplissez les informations de la campagne publicitaire et sélectionnez les magasins participants.
            </DialogDescription>
          </DialogHeader>
          <PublicityForm
            groups={groups}
            onSuccess={closeModals}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Modal */}
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la publicité</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la campagne publicitaire.
            </DialogDescription>
          </DialogHeader>
          <PublicityForm
            publicity={selectedPublicity}
            groups={groups}
            onSuccess={closeModals}
          />
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la publicité</DialogTitle>
            <DialogDescription>
              Informations complètes de la campagne publicitaire.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPublicity && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">N° PUB</label>
                  <p className="text-lg">{selectedPublicity.pubNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Année</label>
                  <p className="text-lg">{selectedPublicity.year}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Désignation</label>
                <p className="mt-1">{selectedPublicity.designation}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de début</label>
                  <p>{format(new Date(selectedPublicity.startDate), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Date de fin</label>
                  <p>{format(new Date(selectedPublicity.endDate), "dd/MM/yyyy", { locale: fr })}</p>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Magasins participants</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedPublicity.participations.length === 0 ? (
                    <Badge className="bg-red-100 text-red-800 hover:bg-red-100">Aucun magasin</Badge>
                  ) : (
                    selectedPublicity.participations.map((participation) => (
                      <Badge key={participation.groupId} variant="outline">
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: participation.group.color }}
                        />
                        {participation.group.name}
                      </Badge>
                    ))
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                <div>
                  <label className="font-medium">Créé par</label>
                  <p>{selectedPublicity.creator.name || selectedPublicity.creator.username}</p>
                </div>
                <div>
                  <label className="font-medium">Créé le</label>
                  <p>{format(selectedPublicity.createdAt, "dd/MM/yyyy à HH:mm", { locale: fr })}</p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer la publicité</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cette publicité ? Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          
          {selectedPublicity && (
            <div className="space-y-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="font-medium">{selectedPublicity.pubNumber}</p>
                <p className="text-sm text-gray-600">{selectedPublicity.designation}</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
                  Annuler
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={confirmDelete}
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? 'Suppression...' : 'Supprimer'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}