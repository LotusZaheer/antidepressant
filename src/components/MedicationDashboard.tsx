import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from './AuthProvider';
import { LoginForm } from './LoginForm';
import { ProductRegistry } from './ProductRegistry';
import { QuantityRegistry } from './QuantityRegistry';
import { ConcentrationChart } from './ConcentrationChart';
import { UserSettings } from './UserSettings';
import { LogOut, Pill, Plus, BarChart3, Settings, LogIn } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export interface Product {
  id: string;
  name: string;
  halfLife: number; // in hours
  color: string;
}

export interface Quantity {
  id: string;
  productId: string;
  amount: number; // in mg
  timestamp: Date;
}


export const MedicationDashboard = () => {
  const { user, logout, loading } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [quantities, setQuantities] = useState<Quantity[]>([]);
  const [activeTab, setActiveTab] = useState('chart');
  const [loginOpen, setLoginOpen] = useState(false);

  // Load products from Supabase
  useEffect(() => {
    const loadProducts = async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Error loading products:', error);
        return;
      }
      
      const formattedProducts: Product[] = data.map(prod => ({
        id: prod.id,
        name: prod.name,
        halfLife: Number(prod.half_life),
        color: prod.color
      }));
      
      setProducts(formattedProducts);
    };

    loadProducts();
  }, []);

  // Load quantities from Supabase
  useEffect(() => {
    const loadQuantities = async () => {
      const { data, error } = await supabase
        .from('quantities')
        .select('*, products(name)')
        .order('timestamp', { ascending: false });
      
      if (error) {
        console.error('Error loading quantities:', error);
        return;
      }
      
      const formattedQuantities: Quantity[] = data.map(qty => ({
        id: qty.id,
        productId: qty.product_id,
        amount: Number(qty.amount),
        timestamp: new Date(qty.timestamp)
      }));
      
      setQuantities(formattedQuantities);
    };

    loadQuantities();
  }, []);

  const addProduct = async (product: Omit<Product, 'id'>) => {
    const { data, error } = await supabase
      .from('products')
      .insert({
        name: product.name,
        half_life: product.halfLife,
        color: product.color
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding product:', error);
      return;
    }

    const newProduct: Product = {
      id: data.id,
      name: data.name,
      halfLife: Number(data.half_life),
      color: data.color
    };

    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = async (productId: string, updates: Partial<Product>) => {
    const { data, error } = await supabase
      .from('products')
      .update({
        name: updates.name,
        half_life: updates.halfLife,
        color: updates.color
      })
      .eq('id', productId)
      .select()
      .single();

    if (error) {
      console.error('Error updating product:', error);
      return;
    }

    const updatedProduct: Product = {
      id: data.id,
      name: data.name,
      halfLife: Number(data.half_life),
      color: data.color
    };

    setProducts(prev => prev.map(p => p.id === productId ? updatedProduct : p));
  };

  const addQuantity = async (quantity: Omit<Quantity, 'id'>) => {
    const { data, error } = await supabase
      .from('quantities')
      .insert({
        product_id: quantity.productId,
        amount: quantity.amount,
        timestamp: quantity.timestamp.toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error adding quantity:', error);
      return;
    }

    const newQuantity: Quantity = {
      id: data.id,
      productId: data.product_id,
      amount: Number(data.amount),
      timestamp: new Date(data.timestamp)
    };

    setQuantities(prev => [newQuantity, ...prev]);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center mx-auto mb-4">
            <Pill className="h-6 w-6 text-white animate-pulse" />
          </div>
          <p className="text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center space-x-2 sm:space-x-3 min-w-0 flex-1">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Pill className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl font-bold text-primary truncate">Sistema de Productos</h1>
                <p className="text-xs sm:text-sm text-muted-foreground truncate">
                  {user?.canEdit ? 'Administrador' : 'Visitante'} - Seguimiento
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              {user ? (
                <>
                  <span className="text-xs sm:text-sm text-muted-foreground hidden sm:block truncate max-w-32">
                    {user.email}
                  </span>
                  <Button variant="outline" onClick={logout} size="sm" className="text-xs sm:text-sm">
                    <LogOut className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                    <span className="hidden sm:inline">Cerrar Sesión</span>
                  </Button>
                </>
              ) : (
                <Dialog open={loginOpen} onOpenChange={setLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs sm:text-sm">
                      <LogIn className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-2" />
                      <span className="hidden sm:inline">Iniciar Sesión</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <LoginForm onClose={() => setLoginOpen(false)} />
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <div className="overflow-x-auto">
            <TabsList className={`grid w-full min-w-fit ${user ? 'grid-cols-4' : 'grid-cols-2'} gap-1`}>
              <TabsTrigger value="chart" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Gráfica</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap">
                <Pill className="h-3 w-3 sm:h-4 sm:w-4" />
                <span>Productos</span>
              </TabsTrigger>
              {user && (
                <>
                  <TabsTrigger value="quantities" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap">
                    <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Registrar Cantidad</span>
                    <span className="sm:hidden">Registrar</span>
                  </TabsTrigger>
                  <TabsTrigger value="settings" className="flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm whitespace-nowrap">
                    <Settings className="h-3 w-3 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Configuración</span>
                    <span className="sm:hidden">Config</span>
                  </TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="chart">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Concentración de Productos</CardTitle>
                <CardDescription>
                  Visualización de la concentración en el cuerpo basada en vida media y cantidades
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ConcentrationChart products={products} quantities={quantities} />
              </CardContent>
            </Card>
          </TabsContent>

          {user && (
            <TabsContent value="quantities">
              <Card className="shadow-medical">
                <CardHeader>
                  <CardTitle>Registrar Nueva Cantidad</CardTitle>
                  <CardDescription>
                    Selecciona un producto e ingresa la cantidad
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <QuantityRegistry 
                    products={products} 
                    onAddQuantity={addQuantity}
                    canEdit={user?.canEdit ?? false}
                  />
                </CardContent>
              </Card>
            </TabsContent>
          )}

          <TabsContent value="products">
            <Card className="shadow-medical">
              <CardHeader>
                <CardTitle>Administrar Productos</CardTitle>
                <CardDescription>
                  Lista de productos y opción para agregar nuevos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductRegistry 
                  products={products} 
                  onAddProduct={addProduct}
                  onUpdateProduct={updateProduct}
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