import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Clock } from 'lucide-react';
import type { Medication, Dose } from './MedicationDashboard';

interface DoseRegistryProps {
  medications: Medication[];
  onAddDose: (dose: Omit<Dose, 'id'>) => void;
  canEdit: boolean;
}

export const DoseRegistry = ({ medications, onAddDose, canEdit }: DoseRegistryProps) => {
  const [selectedMedicationId, setSelectedMedicationId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden registrar dosis",
        variant: "destructive",
      });
      return;
    }

    if (!selectedMedicationId || !amount.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona un medicamento e ingresa la cantidad",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un número positivo",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    const selectedMedication = medications.find(m => m.id === selectedMedicationId);
    
    onAddDose({
      medicationId: selectedMedicationId,
      amount: amountNum,
      timestamp: new Date(),
    });

    setSelectedMedicationId('');
    setAmount('');
    setIsSubmitting(false);

    toast({
      title: "Dosis registrada",
      description: `${amountNum}mg de ${selectedMedication?.name} registrada a las ${new Date().toLocaleTimeString()}`,
    });
  };

  const currentDateTime = new Date().toLocaleString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="space-y-6">
      {canEdit ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-primary" />
              <span>Nueva Dosis</span>
            </CardTitle>
            <CardDescription>
              Registra una nueva dosis de medicamento
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="medication">Medicamento</Label>
                <Select value={selectedMedicationId} onValueChange={setSelectedMedicationId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un medicamento" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: medication.color }}
                          />
                          <span>{medication.name}</span>
                          <span className="text-muted-foreground">({medication.halfLife}h)</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Cantidad (mg)</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="ej. 10"
                  step="0.1"
                  min="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4" />
                  <span>Fecha y hora de registro</span>
                </Label>
                <div className="p-3 bg-accent rounded-md text-sm text-accent-foreground">
                  {currentDateTime} (automático)
                </div>
              </div>

              <Button 
                type="submit" 
                disabled={isSubmitting || medications.length === 0}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isSubmitting ? "Registrando..." : "Registrar Dosis"}
              </Button>

              {medications.length === 0 && (
                <p className="text-sm text-muted-foreground text-center">
                  Primero debes agregar medicamentos en la pestaña "Medicamentos"
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <div className="text-center space-y-3">
              <Clock className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
              <div>
                <p className="font-medium text-warning-foreground">Acceso de solo lectura</p>
                <p className="text-sm text-muted-foreground">
                  Solo los administradores pueden registrar nuevas dosis
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};