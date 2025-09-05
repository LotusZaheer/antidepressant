import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from './AuthProvider';
import { useToast } from '@/hooks/use-toast';
import { Settings, Key, Eye, EyeOff } from 'lucide-react';

interface UserSettingsProps {
  canEdit: boolean;
}

export const UserSettings = ({ canEdit }: UserSettingsProps) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [isChanging, setIsChanging] = useState(false);
  const { user, changePassword } = useAuth();
  const { toast } = useToast();

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "Solo los administradores pueden cambiar la contraseña",
        variant: "destructive",
      });
      return;
    }

    if (!newPassword.trim() || !confirmPassword.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Contraseñas no coinciden",
        description: "La nueva contraseña y la confirmación deben ser iguales",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Contraseña muy corta",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsChanging(true);

    try {
      const { error } = await changePassword(newPassword);
      
      if (error) {
        toast({
          title: "Error al cambiar contraseña",
          description: error,
          variant: "destructive",
        });
      } else {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        toast({
          title: "Contraseña actualizada",
          description: "Tu contraseña ha sido cambiada exitosamente",
        });
      }
    } catch (error) {
      toast({
        title: "Error al cambiar contraseña",
        description: "Error al conectar con el servidor",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* User info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5 text-primary" />
            <span>Información de Usuario</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">Email</Label>
              <p className="text-sm text-muted-foreground">{user?.email || 'Visitante'}</p>
            </div>
            <div>
              <Label className="text-sm font-medium">Tipo de cuenta</Label>
              <p className="text-sm text-muted-foreground">
                {canEdit ? 'Administrador' : 'Visitante (solo lectura)'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change password */}
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5 text-primary" />
              <span>Cambiar Contraseña</span>
            </CardTitle>
            <CardDescription>
              Actualiza tu contraseña para mantener tu cuenta segura
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showPasswords ? "text" : "password"}
                    placeholder="Ingresa tu nueva contraseña"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                    onClick={() => setShowPasswords(!showPasswords)}
                  >
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar nueva contraseña</Label>
                <Input
                  id="confirmPassword"
                  type={showPasswords ? "text" : "password"}
                  placeholder="Confirma tu nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <Button 
                type="submit" 
                disabled={isChanging}
                className="w-full bg-gradient-primary hover:opacity-90 transition-opacity"
              >
                {isChanging ? "Cambiando contraseña..." : "Cambiar Contraseña"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* App info */}
      <Card>
        <CardHeader>
          <CardTitle>Información del Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex justify-between">
            <span>Versión:</span>
            <span>1.0.0</span>
          </div>
          <div className="flex justify-between">
            <span>Última actualización:</span>
            <span>{new Date().toLocaleDateString('es-ES')}</span>
          </div>
          <div className="flex justify-between">
            <span>Medicamentos soportados:</span>
            <span>Ilimitados</span>
          </div>
          <div className="flex justify-between">
            <span>Cálculo de concentración:</span>
            <span>Exponencial (vida media)</span>
          </div>
        </CardContent>
      </Card>

      {!canEdit && (
        <Card className="border-warning/20 bg-warning/5">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground text-center">
              <span className="font-medium">Acceso limitado:</span> Como visitante, solo puedes ver la información pero no realizar cambios
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};