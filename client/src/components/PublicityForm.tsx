import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import type { PublicityWithRelations, Group } from "@shared/schema";

const publicityFormSchema = z.object({
  pubNumber: z.string().min(1, "Le numéro PUB est requis"),
  designation: z.string().min(1, "La désignation est requise"),
  startDate: z.date({ required_error: "La date de début est requise" }),
  endDate: z.date({ required_error: "La date de fin est requise" }),
  year: z.number().min(2020).max(2030),
  participatingGroups: z.array(z.number()).min(1, "Au moins un magasin doit participer"),
}).refine((data) => data.endDate >= data.startDate, {
  message: "La date de fin doit être postérieure à la date de début",
  path: ["endDate"]
});

type PublicityFormData = z.infer<typeof publicityFormSchema>;

interface PublicityFormProps {
  publicity?: PublicityWithRelations | null;
  groups: Group[];
  onSuccess: () => void;
}

export default function PublicityForm({ publicity, groups, onSuccess }: PublicityFormProps) {
  const [startCalendarOpen, setStartCalendarOpen] = useState(false);
  const [endCalendarOpen, setEndCalendarOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<PublicityFormData>({
    resolver: zodResolver(publicityFormSchema),
    defaultValues: {
      pubNumber: publicity?.pubNumber || "",
      designation: publicity?.designation || "",
      startDate: publicity?.startDate ? new Date(publicity.startDate) : undefined,
      endDate: publicity?.endDate ? new Date(publicity.endDate) : undefined,
      year: publicity?.year || new Date().getFullYear(),
      participatingGroups: publicity?.participations?.map(p => p.groupId) || [],
    }
  });

  // Mettre à jour l'année automatiquement quand les dates changent
  const watchedStartDate = form.watch("startDate");
  useEffect(() => {
    if (watchedStartDate) {
      form.setValue("year", watchedStartDate.getFullYear());
    }
  }, [watchedStartDate, form]);

  const createMutation = useMutation({
    mutationFn: async (data: PublicityFormData) => {
      const response = await fetch('/api/publicities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubNumber: data.pubNumber,
          designation: data.designation,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          endDate: format(data.endDate, 'yyyy-MM-dd'),
          year: data.year,
          participatingGroups: data.participatingGroups
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la création');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/publicities'] });
      toast({ description: "Publicité créée avec succès" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Erreur lors de la création" 
      });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: PublicityFormData) => {
      const response = await fetch(`/api/publicities/${publicity!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pubNumber: data.pubNumber,
          designation: data.designation,
          startDate: format(data.startDate, 'yyyy-MM-dd'),
          endDate: format(data.endDate, 'yyyy-MM-dd'),
          year: data.year,
          participatingGroups: data.participatingGroups
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erreur lors de la modification');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/publicities'] });
      toast({ description: "Publicité modifiée avec succès" });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({ 
        variant: "destructive",
        description: error.message || "Erreur lors de la modification" 
      });
    }
  });

  const onSubmit = (data: PublicityFormData) => {
    if (publicity) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  const handleGroupToggle = (groupId: number, checked: boolean) => {
    const currentGroups = form.getValues("participatingGroups");
    if (checked) {
      form.setValue("participatingGroups", [...currentGroups, groupId]);
    } else {
      form.setValue("participatingGroups", currentGroups.filter(id => id !== groupId));
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Informations de base */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="pubNumber">N° PUB *</Label>
          <Input
            id="pubNumber"
            placeholder="PUB-2025-001"
            {...form.register("pubNumber")}
          />
          {form.formState.errors.pubNumber && (
            <p className="text-sm text-destructive">{form.formState.errors.pubNumber.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="year">Année</Label>
          <Input
            id="year"
            type="number"
            disabled
            {...form.register("year", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="designation">Désignation *</Label>
        <Textarea
          id="designation"
          placeholder="Description de la campagne publicitaire..."
          {...form.register("designation")}
        />
        {form.formState.errors.designation && (
          <p className="text-sm text-destructive">{form.formState.errors.designation.message}</p>
        )}
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date de début *</Label>
          <Popover open={startCalendarOpen} onOpenChange={setStartCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("startDate") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("startDate") 
                  ? format(form.watch("startDate"), "dd/MM/yyyy", { locale: fr })
                  : "Sélectionner une date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("startDate")}
                onSelect={(date) => {
                  form.setValue("startDate", date!);
                  setStartCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.startDate && (
            <p className="text-sm text-destructive">{form.formState.errors.startDate.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label>Date de fin *</Label>
          <Popover open={endCalendarOpen} onOpenChange={setEndCalendarOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !form.watch("endDate") && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {form.watch("endDate") 
                  ? format(form.watch("endDate"), "dd/MM/yyyy", { locale: fr })
                  : "Sélectionner une date"
                }
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={form.watch("endDate")}
                onSelect={(date) => {
                  form.setValue("endDate", date!);
                  setEndCalendarOpen(false);
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {form.formState.errors.endDate && (
            <p className="text-sm text-destructive">{form.formState.errors.endDate.message}</p>
          )}
        </div>
      </div>

      {/* Sélection des magasins */}
      <Card>
        <CardHeader>
          <CardTitle>Magasins participants *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {groups.map((group) => (
              <div key={group.id} className="flex items-center space-x-2">
                <Checkbox
                  id={`group-${group.id}`}
                  checked={form.watch("participatingGroups").includes(group.id)}
                  onCheckedChange={(checked) => handleGroupToggle(group.id, !!checked)}
                />
                <Label
                  htmlFor={`group-${group.id}`}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <div
                    className="w-3 h-3 rounded"
                    style={{ backgroundColor: group.color }}
                  />
                  {group.name}
                </Label>
              </div>
            ))}
          </div>
          {form.formState.errors.participatingGroups && (
            <p className="text-sm text-destructive mt-2">
              {form.formState.errors.participatingGroups.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Annuler
        </Button>
        <Button 
          type="submit" 
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {createMutation.isPending || updateMutation.isPending ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              {publicity ? 'Modification...' : 'Création...'}
            </div>
          ) : (
            publicity ? 'Modifier' : 'Créer'
          )}
        </Button>
      </div>
    </form>
  );
}