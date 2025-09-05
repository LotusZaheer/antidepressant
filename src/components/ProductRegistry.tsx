import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Clock, Package } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Product } from './MedicationDashboard';

const PRODUCT_COLORS = [
  '#4f46e5', '#059669', '#dc2626', '#d97706', 
  '#7c3aed', '#0891b2', '#be185d', '#65a30d'
];

interface ProductRegistryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  canEdit: boolean;
}

export const ProductRegistry = ({ products, onAddProduct, canEdit }: ProductRegistryProps) => {
  const [name, setName] = useState('');
  const [halfLife, setHalfLife] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para agregar productos.",
        variant: "destructive",
      });
      return;
    }

    if (!name.trim() || !halfLife.trim()) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos.",
        variant: "destructive",
      });
      return;
    }

    const halfLifeNum = parseFloat(halfLife);
    if (isNaN(halfLifeNum) || halfLifeNum <= 0) {
      toast({
        title: "Vida media inválida",
        description: "La vida media debe ser un número positivo.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const usedColors = products.map(p => p.color);
      const availableColors = PRODUCT_COLORS.filter(color => !usedColors.includes(color));
      const selectedColor = availableColors.length > 0 
        ? availableColors[0] 
        : PRODUCT_COLORS[Math.floor(Math.random() * PRODUCT_COLORS.length)];

      onAddProduct({
        name: name.trim(),
        halfLife: halfLifeNum,
        color: selectedColor
      });

      setName('');
      setHalfLife('');
      
      toast({
        title: "Producto agregado",
        description: `${name} ha sido registrado exitosamente.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al agregar el producto.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Agregar Producto</span>
            </CardTitle>
            <CardDescription>
              Registra un nuevo producto con su vida media correspondiente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre del Producto</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Paracetamol"
                    disabled={isSubmitting}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="halfLife">Vida Media (horas)</Label>
                  <Input
                    id="halfLife"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={halfLife}
                    onChange={(e) => setHalfLife(e.target.value)}
                    placeholder="ej. 4.5"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting ? 'Agregando...' : 'Agregar Producto'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!canEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Acceso de Solo Lectura</CardTitle>
            <CardDescription>
              Actualmente tienes acceso de solo lectura. Contacta al administrador para obtener permisos de edición.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5" />
            <span>Productos Registrados</span>
          </CardTitle>
          <CardDescription>
            {products.length === 0 ? 'No hay productos registrados aún.' : `${products.length} producto${products.length !== 1 ? 's' : ''} registrado${products.length !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Agrega tu primer producto para comenzar el seguimiento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 border rounded-lg space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: product.color }}
                      />
                      <h3 className="font-medium">{product.name}</h3>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Vida media: {product.halfLife}h</span>
                  </div>

                  <Badge variant="secondary" className="text-xs">
                    ID: {product.id.substring(0, 8)}...
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};