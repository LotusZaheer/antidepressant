import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from './AuthProvider';
import { MedicationRegistry } from './MedicationRegistry';
import { DoseRegistry } from './DoseRegistry';
import { ConcentrationChart } from './ConcentrationChart';
import { UserSettings } from './UserSettings';
import { LogOut, Pill, Plus, BarChart3, Settings } from 'lucide-react';

export interface Medication {
  id: string;
  name: string;
  halfLife: number; // in hours
  color: string;
}

export interface Dose {
  id: string;
  medicationId: string;
  amount: number; // in mg
  timestamp: Date;
}

// Mock data for demonstration
const INITIAL_MEDICATIONS: Medication[] = [
  { id: '1', name: 'Escitalopram', halfLife: 30, color: 'hsl(var(--medical-blue))' },
  { id: '2', name: 'Bupiron', halfLife: 24, color: 'hsl(var(--medical-teal))' },
];

const INITIAL_DOSES: Dose[] = [
  { 
    id: '1', 
    medicationId: '1', 
    amount: 10, 
    timestamp: new Date(Date.now() - 10 * 60 * 60 * 1000) // 10 hours ago
  },
  { 
    id: '2', 
    medicationId: '2', 
    amount: 20, 
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 hours ago
  },
];

export const MedicationDashboard = () => {
  const { user, logout } = useAuth();
  const [medications, setMedications] = useState<Medication[]>(INITIAL_MEDICATIONS);
  const [doses, setDoses] = useState<Dose[]>(INITIAL_DOSES);
  const [activeTab, setActiveTab] = useState('chart');

  const addMedication = (medication: Omit<Medication, 'id'>) => {
    const newMedication: Medication = {
      ...medication,
      id: Date.now().toString(),
    };
    setMedications(prev => [...prev, newMedication]);
  };

  const addDose = (dose: Omit<Dose, 'id'>) => {
    const newDose: Dose = {
      ...dose,
      id: Date.now().toString(),
    };
    setDoses(prev => [...prev, newDose]);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Sistema de Medicamentos</h1>
              <p className="text-sm text-muted-foreground">
                {user?.canEdit ? 'Administrador' : 'Visitante'} - Seguimiento de concentración
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-muted-foreground">
                {user.email}
              </span>
            )}
            <Button variant="outline" onClick={logout} size="sm">
              <LogOut className="h-4 w-4 mr-2" />
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Gráfica</span>
            </TabsTrigger>
            <TabsTrigger value="doses" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Registrar Dosis</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center space-x-2">
              <Pill className="h-4 w-4" />
              <span>Medicamentos</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Configuración</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="chart">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Concentración de Medicamentos</CardTitle>
                <CardDescription>
                  Visualización de la concentración en el cuerpo basada en vida media y dosis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConcentrationChart medications={medications} doses={doses} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="doses">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Registrar Nueva Dosis</CardTitle>
                <CardDescription>
                  Selecciona un medicamento e ingresa la cantidad
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DoseRegistry 
                  medications={medications} 
                  onAddDose={addDose}
                  canEdit={user?.canEdit ?? false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medications">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Administrar Medicamentos</CardTitle>
                <CardDescription>
                  Lista de medicamentos y opción para agregar nuevos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <MedicationRegistry 
                  medications={medications} 
                  onAddMedication={addMedication}
                  canEdit={user?.canEdit ?? false}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Configuración de Usuario</CardTitle>
                <CardDescription>
                  Administra tu cuenta y configuraciones
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UserSettings canEdit={user?.canEdit ?? false} />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};