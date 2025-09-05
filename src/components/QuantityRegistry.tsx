import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Product, Quantity } from './MedicationDashboard';

interface QuantityRegistryProps {
  products: Product[];
  onAddQuantity: (quantity: Omit<Quantity, 'id'>) => void;
  canEdit: boolean;
}

export const QuantityRegistry = ({ products, onAddQuantity, canEdit }: QuantityRegistryProps) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [amount, setAmount] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para agregar cantidades.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedProductId || !amount.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor selecciona un producto e ingresa la cantidad.",
        variant: "destructive",
      });
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast({
        title: "Cantidad inválida",
        description: "La cantidad debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const selectedProduct = products.find(p => p.id === selectedProductId);

      onAddQuantity({
        productId: selectedProductId,
        amount: amountNum,
        timestamp: new Date()
      });

      setAmount('');
      setSelectedProductId('');
      
      toast({
        title: "Cantidad registrada",
        description: `${amountNum}mg de ${selectedProduct?.name} registrada a las ${new Date().toLocaleTimeString()}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al registrar la cantidad.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canEdit) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acceso de Solo Lectura</CardTitle>
          <CardDescription>
            Actualmente tienes acceso de solo lectura. Contacta al administrador para obtener permisos de edición.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Plus className="h-5 w-5" />
          <span>Registrar Cantidad</span>
        </CardTitle>
        <CardDescription>
          Registra una nueva cantidad de producto consumida.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="product">Producto</Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center space-x-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: product.color }}
                        />
                        <span>{product.name}</span>
                        <span className="text-muted-foreground">({product.halfLife}h)</span>
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
                step="0.1"
                min="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="ej. 500"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Fecha y hora: {new Date().toLocaleString()}</span>
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || products.length === 0}
          >
            {isSubmitting ? 'Registrando...' : 'Registrar Cantidad'}
          </Button>

          {products.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Primero debes agregar al menos un producto en la pestaña "Productos".
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
};