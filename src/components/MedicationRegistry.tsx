import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pill, Clock } from 'lucide-react';
import type { Medication } from './MedicationDashboard';

const MEDICATION_COLORS = [
  'hsl(var(--medical-blue))',
  'hsl(var(--medical-teal))',
  'hsl(var(--medical-green))',
  'hsl(var(--medical-purple))',
  'hsl(var(--medical-orange))',
  'hsl(var(--medical-pink))',
];

interface MedicationRegistryProps {
  medications: Medication[];
  onAddMedication: (medication: Omit<Medication, 'id'>) => void;
  canEdit: boolean;
}

export const MedicationRegistry = ({ medications, onAddMedication, canEdit }: MedicationRegistryProps) => {
  const [name, setName] = useState('');
  const [halfLife, setHalfLife] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden agregar medicamentos",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !halfLife.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    const halfLifeNum = parseFloat(halfLife);
    if (isNaN(halfLifeNum) || halfLifeNum <= 0) {
      toast({
        title: "Vida media inválida",
        description: "La vida media debe ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const colorIndex = medications.length % MEDICATION_COLORS.length;
    
    onAddMedication({
      name: name.trim(),
      halfLife: halfLifeNum,
      color: MEDICATION_COLORS[colorIndex],
    });

    setName('');
    setHalfLife('');
    setIsSubmitting(false);

    toast({
      title: "Medicamento agregado",
      description: `${name} ha sido agregado exitosamente`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Add new medication form */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Agregar Nuevo Medicamento</span>
            </CardTitle>
            <CardDescription>
              Ingresa el nombre y la vida media en horas del medicamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del medicamento</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="ej. Escitalopram"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="halfLife">Vida media (horas)</Label>
                  <Input
                    id="halfLife"
                    type="number"
                    placeholder="ej. 30"
                    step="0.1"
                    min="0.1"
                    value={halfLife}
                    onChange={(e) => setHalfLife(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? "Agregando..." : "Agregar Medicamento"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Existing medications list */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Pill className="h-5 w-5 text-primary" />
            <span>Medicamentos Registrados</span>
          </CardTitle>
          <CardDescription>
            Lista de todos los medicamentos disponibles
          </CardDescription>
        </CardHeader>
        <CardContent>
          {medications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Pill className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay medicamentos registrados aún</p>
              {canEdit && <p className="text-sm">Agrega el primer medicamento usando el formulario arriba</p>}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medications.map((medication) => (
                <div
                  key={medication.id}
                  className="border rounded-lg p-4 space-y-3 hover:shadow-medical transition-shadow"
                >
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full border-2" 
                      style={{ backgroundColor: medication.color }}
                    />
                    <h3 className="font-semibold text-lg">{medication.name}</h3>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">Vida media: {medication.halfLife}h</span>
                  </div>
                  <Badge variant="secondary" className="w-fit">
                    ID: {medication.id}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!canEdit && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium">Acceso de solo lectura:</span> Solo los administradores pueden agregar o modificar medicamentos
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
