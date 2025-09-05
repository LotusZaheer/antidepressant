import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Clock, Package, Palette } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { Product } from './MedicationDashboard';

const PRODUCT_COLORS = [
  '#4f46e5', '#059669', '#dc2626', '#d97706', 
  '#7c3aed', '#0891b2', '#be185d', '#65a30d'
];

interface ProductRegistryProps {
  products: Product[];
  onAddProduct: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct: (productId: string, updates: Partial<Product>) => void;
  canEdit: boolean;
}

export const ProductRegistry = ({ products, onAddProduct, onUpdateProduct, canEdit }: ProductRegistryProps) => {
  const [name, setName] = useState('');
  const [halfLife, setHalfLife] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const handleColorChange = async (productId: string, newColor: string) => {
    if (!canEdit) {
      toast({
        title: "Acceso denegado",
        description: "No tienes permisos para editar productos.",
        variant: "destructive",
      });
      return;
    }

    try {
      await onUpdateProduct(productId, { color: newColor });
      toast({
        title: "Color actualizado",
        description: "El color del producto ha sido cambiado exitosamente.",
      });
      setColorDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Hubo un problema al actualizar el color.",
        variant: "destructive",
      });
    }
  };

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
    <div className="space-y-4 sm:space-y-6">
      {canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
              <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>Agregar Producto</span>
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Registra un nuevo producto con su vida media correspondiente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs sm:text-sm">Nombre del Producto</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ej. Paracetamol"
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="halfLife" className="text-xs sm:text-sm">Vida Media (horas)</Label>
                  <Input
                    id="halfLife"
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={halfLife}
                    onChange={(e) => setHalfLife(e.target.value)}
                    placeholder="ej. 4.5"
                    disabled={isSubmitting}
                    className="text-sm"
                  />
                </div>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full text-sm">
                {isSubmitting ? 'Agregando...' : 'Agregar Producto'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {!canEdit && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm sm:text-base">Acceso de Solo Lectura</CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              Actualmente tienes acceso de solo lectura. Contacta al administrador para obtener permisos de edición.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-sm sm:text-base">
            <Package className="h-4 w-4 sm:h-5 sm:w-5" />
            <span>Productos Registrados</span>
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {products.length === 0 ? 'No hay productos registrados aún.' : `${products.length} producto${products.length !== 1 ? 's' : ''} registrado${products.length !== 1 ? 's' : ''}.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <div className="text-center py-6 sm:py-8 text-muted-foreground">
              <Package className="h-8 w-8 sm:h-12 sm:w-12 mx-auto mb-3 sm:mb-4 opacity-50" />
              <p className="text-sm">Agrega tu primer producto para comenzar el seguimiento.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-3 sm:p-4 border rounded-lg space-y-2 sm:space-y-3 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center space-x-2 min-w-0 flex-1">
                      <div
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: product.color }}
                      />
                      <h3 className="font-medium text-sm sm:text-base truncate">{product.name}</h3>
                    </div>
                    {canEdit && (
                      <Dialog open={colorDialogOpen && selectedProduct?.id === product.id} onOpenChange={(open) => {
                        setColorDialogOpen(open);
                        if (!open) setSelectedProduct(null);
                      }}>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedProduct(product)}
                            className="h-5 w-5 sm:h-6 sm:w-6 p-0 flex-shrink-0"
                          >
                            <Palette className="h-2.5 w-2.5 sm:h-3 sm:w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md mx-3 sm:mx-0">
                          <DialogHeader>
                            <DialogTitle className="text-sm sm:text-base">Cambiar Color - {product.name}</DialogTitle>
                          </DialogHeader>
                          <div className="grid grid-cols-4 gap-2 sm:gap-3 py-4">
                            {PRODUCT_COLORS.map((color) => (
                              <button
                                key={color}
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-lg border-2 transition-all hover:scale-110 ${
                                  product.color === color ? 'border-primary ring-2 ring-primary/20' : 'border-muted'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(product.id, color)}
                              />
                            ))}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 text-xs sm:text-sm text-muted-foreground">
                    <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
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