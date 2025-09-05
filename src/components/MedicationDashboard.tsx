import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { MedicationRegistry } from './MedicationRegistry';
import { DoseRegistry } from './DoseRegistry';
import { ConcentrationChart } from './ConcentrationChart';
import { UserSettings } from './UserSettings';
import { LogOut, Pill, Plus, BarChart3, Settings, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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


export const MedicationDashboard = () => {
  const { user, logout } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [doses, setDoses] = useState<Dose[]>([]);
  const [activeTab, setActiveTab] = useState('chart');
  const [loginOpen, setLoginOpen] = useState(false);

  // Load medications from Supabase
  useEffect(() => {
    const loadMedications = async () => {
      const { data, error } = await supabase
        .from('medications')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading medications:', error);
        return;
      }
      
      const formattedMedications: Medication[] = data.map(med => ({
        id: med.id,
        name: med.name,
        halfLife: Number(med.half_life),
        color: med.color
      }));
      
      setMedications(formattedMedications);
    };

    loadMedications();
  }, []);

  // Load doses from Supabase
  useEffect(() => {
    const loadDoses = async () => {
      const { data, error } = await supabase
        .from('doses')
        .select('*, medications(name)')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error loading doses:', error);
        return;
      }
      
      const formattedDoses: Dose[] = data.map(dose => ({
        id: dose.id,
        medicationId: dose.medication_id,
        amount: Number(dose.amount),
        timestamp: new Date(dose.timestamp)
      }));
      
      setDoses(formattedDoses);
    };

    loadDoses();
  }, []);

  const addMedication = async (medication: Omit<Medication, 'id'>) => {
    const { data, error } = await supabase
      .from('medications')
      .insert({
        name: medication.name,
        half_life: medication.halfLife,
        color: medication.color
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding medication:', error);
      return;
    }

    const newMedication: Medication = {
      id: data.id,
      name: data.name,
      halfLife: Number(data.half_life),
      color: data.color
    };

    setMedications(prev => [...prev, newMedication]);
  };

  const addDose = async (dose: Omit<Dose, 'id'>) => {
    const { data, error } = await supabase
      .from('doses')
      .insert({
        medication_id: dose.medicationId,
        amount: dose.amount,
        timestamp: dose.timestamp.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding dose:', error);
      return;
    }

    const newDose: Dose = {
      id: data.id,
      medicationId: data.medication_id,
      amount: Number(data.amount),
      timestamp: new Date(data.timestamp)
    };

    setDoses(prev => [newDose, ...prev]);
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
            {user ? (
              <>
                <span className="text-sm text-muted-foreground">
                  {user.email}
                </span>
                <Button variant="outline" onClick={logout} size="sm">
                  <LogOut className="h-4 w-4 mr-2" />
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <LogIn className="h-4 w-4 mr-2" />
                    Iniciar Sesión
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <LoginForm onClose={() => setLoginOpen(false)} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className={`grid w-full ${user ? 'grid-cols-4' : 'grid-cols-2'}`}>
            <TabsTrigger value="chart" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Gráfica</span>
            </TabsTrigger>
            <TabsTrigger value="medications" className="flex items-center space-x-2">
              <Pill className="h-4 w-4" />
              <span>Medicamentos</span>
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="doses" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Registrar Dosis</span>
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center space-x-2">
                  <Settings className="h-4 w-4" />
                  <span>Configuración</span>
                </TabsTrigger>
              </>
            )}
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

          {user && (
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
          )}

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

          {user && (
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
          )}
        </Tabs>
      </div>
    </div>
  );
};