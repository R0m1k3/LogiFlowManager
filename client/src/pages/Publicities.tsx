import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar, Search, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import PublicityForm from "@/components/PublicityForm";
import type { PublicityWithRelations } from "@shared/schema";

export default function Publicities() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState("");
  const [editingPublicity, setEditingPublicity] = useState<PublicityWithRelations | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  
  const { selectedStoreId } = useStore();
  const queryClient = useQueryClient();

  // Générer les années disponibles (actuelle + 2 prochaines)
  const availableYears = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() + i);

  const { data: publicities = [], isLoading } = useQuery({
    queryKey: ['/api/publicities', selectedYear, selectedStoreId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedYear) params.set('year', selectedYear.toString());
      if (selectedStoreId) params.set('storeId', selectedStoreId.toString());
      
      const response = await fetch(`/api/publicities?${params}`);
      if (!response.ok) throw new Error('Erreur lors de la récupération des publicités');
      return response.json() as PublicityWithRelations[];
    }
  });

  const { data: groups = [] } = useQuery({
    queryKey: ['/api/groups'],
    queryFn: async () => {
      const response = await fetch('/api/groups');
      if (!response.ok) throw new Error('Erreur lors de la récupération des groupes');
      return response.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/publicities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Erreur lors de la suppression');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/publicities'] });
    }
  });

  // Filtrer les publicités par terme de recherche
  const filteredPublicities = publicities.filter(pub => 
    pub.pubNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pub.designation.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (publicity: PublicityWithRelations) => {
    setEditingPublicity(publicity);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette publicité ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingPublicity(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Publicités</h1>
          <p className="text-muted-foreground">Gestion des campagnes publicitaires et participation des magasins</p>
        </div>
        
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvelle Publicité
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-2xl border shadow-lg">
            <DialogHeader>
              <DialogTitle>
                {editingPublicity ? 'Modifier la publicité' : 'Nouvelle publicité'}
              </DialogTitle>
            </DialogHeader>
            <PublicityForm 
              publicity={editingPublicity} 
              groups={groups}
              onSuccess={handleFormClose}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2 flex-1">
              <Search className="h-4 w-4" />
              <Input
                placeholder="Rechercher par N° PUB ou désignation..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="max-w-md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table des publicités */}
      <Card>
        <CardHeader>
          <CardTitle>Publicités {selectedYear} ({filteredPublicities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredPublicities.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucune publicité trouvée pour {selectedYear}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N° PUB</TableHead>
                  <TableHead>Désignation</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead>Magasins participants</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPublicities.map((publicity) => (
                  <TableRow key={publicity.id}>
                    <TableCell className="font-mono">{publicity.pubNumber}</TableCell>
                    <TableCell className="font-medium">{publicity.designation}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Du {format(new Date(publicity.startDate), 'dd/MM/yyyy', { locale: fr })}
                        <br />
                        au {format(new Date(publicity.endDate), 'dd/MM/yyyy', { locale: fr })}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {publicity.participations.map((participation) => (
                          <Badge 
                            key={participation.groupId} 
                            variant="secondary"
                            style={{ backgroundColor: participation.group.color + '20', color: participation.group.color }}
                          >
                            {participation.group.name}
                          </Badge>
                        ))}
                        {publicity.participations.length === 0 && (
                          <span className="text-muted-foreground text-sm">Aucun magasin</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(publicity)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(publicity.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}