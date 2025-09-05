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
      <header className="bg-card border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center">
              <Pill className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">Sistema de Productos</h1>
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
            <TabsTrigger value="products" className="flex items-center space-x-2">
              <Pill className="h-4 w-4" />
              <span>Productos</span>
            </TabsTrigger>
            {user && (
              <>
                <TabsTrigger value="quantities" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Registrar Cantidad</span>
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