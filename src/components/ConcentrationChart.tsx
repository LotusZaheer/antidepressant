import { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Clock, TrendingUp, Info, CalendarIcon, Settings } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Product, Quantity } from './MedicationDashboard';

interface ConcentrationChartProps {
  products: Product[];
  quantities: Quantity[];
}

interface ChartDataPoint {
  time: number;
  timeLabel: string;
  [productId: string]: number | string;
}

// Helper function to calculate concentration based on exponential decay (half-life model)
const calculateConcentration = (initialAmount: number, halfLife: number, timeElapsed: number): number => {
  const lambda = Math.log(2) / halfLife; // decay constant
  return initialAmount * Math.exp(-lambda * timeElapsed);
};

type TimeRangePreset = 'day' | 'week' | 'month' | 'custom';

export const ConcentrationChart = ({ products, quantities }: ConcentrationChartProps) => {
  const [timeRange, setTimeRange] = useState<TimeRangePreset>('week');
  const [customStartDate, setCustomStartDate] = useState<Date>();
  const [customEndDate, setCustomEndDate] = useState<Date>();
  const [customStartTime, setCustomStartTime] = useState('00:00');
  const [customEndTime, setCustomEndTime] = useState('23:59');
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [visibleProducts, setVisibleProducts] = useState<Set<string>>(new Set());

  // Initialize visible products when products change
  useMemo(() => {
    setVisibleProducts(new Set(products.map(p => p.id)));
  }, [products]);

  const toggleProductVisibility = (productId: string) => {
    setVisibleProducts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  const getTimeRange = () => {
    const now = new Date();
    
    switch (timeRange) {
      case 'day':
        return {
          start: new Date(now.getTime() - 12 * 60 * 60 * 1000), // 12 hours ago
          end: new Date(now.getTime() + 12 * 60 * 60 * 1000)   // 12 hours ahead
        };
      case 'week':
        return {
          start: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000), // 3.5 days ago
          end: new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000)   // 3.5 days ahead
        };
      case 'month':
        return {
          start: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
          end: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000)   // 15 days ahead
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          const [startHour, startMinute] = customStartTime.split(':').map(Number);
          const [endHour, endMinute] = customEndTime.split(':').map(Number);
          
          const start = new Date(customStartDate);
          start.setHours(startHour, startMinute, 0, 0);
          
          const end = new Date(customEndDate);
          end.setHours(endHour, endMinute, 59, 999);
          
          return { start, end };
        }
        // Fallback to week if custom dates not set
        return {
          start: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000),
          end: new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000)
        };
      default:
        return {
          start: new Date(now.getTime() - 3.5 * 24 * 60 * 60 * 1000), // 3.5 days ago
          end: new Date(now.getTime() + 3.5 * 24 * 60 * 60 * 1000)   // 3.5 days ahead
        };
    }
  };

  const chartData = useMemo(() => {
    if (products.length === 0 || quantities.length === 0) return [];

    const { start, end } = getTimeRange();
    const totalHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    
    // Determine interval based on total hours
    let intervalHours: number;
    if (totalHours <= 24) {
      intervalHours = 1; // 1 hour intervals for day view
    } else if (totalHours <= 168) {
      intervalHours = 2; // 2 hour intervals for week view
    } else {
      intervalHours = 6; // 6 hour intervals for month view
    }

    const dataPoints: ChartDataPoint[] = [];
    
    // Generate time points
    for (let time = start.getTime(); time <= end.getTime(); time += intervalHours * 60 * 60 * 1000) {
      const timeLabel = new Date(time).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: totalHours <= 24 ? '2-digit' : undefined
      });

      const dataPoint: ChartDataPoint = {
        time,
        timeLabel
      };

      // Calculate concentration for each product
      products.forEach(product => {
        const productQuantities = quantities.filter(q => q.productId === product.id);
        let totalConcentration = 0;

        // Sum concentrations from all quantities of this product
        productQuantities.forEach(quantity => {
          const quantityTime = quantity.timestamp.getTime();
          const hoursElapsed = (time - quantityTime) / (1000 * 60 * 60);
          
          if (hoursElapsed >= 0) {
            // Only calculate if the quantity has already been taken at this time point
            totalConcentration += calculateConcentration(quantity.amount, product.halfLife, hoursElapsed);
          }
        });

        dataPoint[product.id] = Math.max(0, totalConcentration);
      });

      dataPoints.push(dataPoint);
    }

    return dataPoints;
  }, [products, quantities, timeRange, customStartDate, customEndDate, customStartTime, customEndTime]);

  const formatTooltip = (value: any, name: string) => {
    const product = products.find(m => m.id === name);
    if (product && typeof value === 'number') {
      return [`${value.toFixed(2)} mg`, product.name];
    }
    return [value, name];
  };

  const formatXAxisLabel = (tickItem: string) => {
    return tickItem;
  };

  if (products.length === 0 || quantities.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <TrendingUp className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium mb-2">No hay datos para mostrar</h3>
        <p className="text-muted-foreground mb-4">
          {products.length === 0 
            ? 'Agrega productos en la pestaña "Productos" para comenzar.' 
            : 'Registra cantidades en la pestaña "Registrar Cantidad" para ver la gráfica.'
          }
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Settings className="h-4 w-4" />
            <span>Rango de Tiempo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant={timeRange === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('day')}
            >
              1 Día
            </Button>
            <Button
              variant={timeRange === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('week')}
            >
              1 Semana
            </Button>
            <Button
              variant={timeRange === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('month')}
            >
              1 Mes
            </Button>
            <Button
              variant={timeRange === 'custom' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('custom')}
            >
              Personalizado
            </Button>
          </div>

          {timeRange === 'custom' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg bg-muted/30">
              <div className="space-y-3">
                <Label className="text-sm font-medium">Fecha y Hora de Inicio</Label>
                <div className="flex gap-2">
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !customStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customStartDate ? format(customStartDate, "PPP") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customStartDate}
                        onSelect={(date) => {
                          setCustomStartDate(date);
                          setStartDateOpen(false);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Fecha y Hora de Fin</Label>
                <div className="flex gap-2">
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "justify-start text-left font-normal flex-1",
                          !customEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {customEndDate ? format(customEndDate, "PPP") : "Seleccionar fecha"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={customEndDate}
                        onSelect={(date) => {
                          setCustomEndDate(date);
                          setEndDateOpen(false);
                        }}
                        initialFocus
                        className={cn("p-3 pointer-events-auto")}
                      />
                    </PopoverContent>
                  </Popover>
                  <Input
                    type="time"
                    value={customEndTime}
                    onChange={(e) => setCustomEndTime(e.target.value)}
                    className="w-32"
                  />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Product Legend */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium">Productos (Click para mostrar/ocultar)</h4>
        <div className="flex flex-wrap gap-2">
          {products.map(product => {
            const productQuantities = quantities.filter(q => q.productId === product.id);
            const totalQuantities = productQuantities.length;
            const totalAmount = productQuantities.reduce((sum, quantity) => sum + quantity.amount, 0);
            const isVisible = visibleProducts.has(product.id);
            
            return (
              <Badge 
                key={product.id} 
                variant={isVisible ? "default" : "secondary"} 
                className={cn(
                  "flex items-center space-x-2 px-3 py-2 cursor-pointer transition-all",
                  !isVisible && "opacity-50"
                )}
                onClick={() => toggleProductVisibility(product.id)}
              >
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: isVisible ? product.color : '#888' }}
                />
                <span className="font-medium">{product.name}</span>
                <span className="text-xs opacity-75">
                  ({totalQuantities} cantidades, {totalAmount}mg total)
                </span>
              </Badge>
            );
          })}
        </div>
      </div>

      {/* Chart */}
      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 25,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="timeLabel" 
              tick={{ fontSize: 12 }}
              tickFormatter={formatXAxisLabel}
              interval="preserveStartEnd"
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              label={{ value: 'Concentración (mg)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelClassName="text-foreground"
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Legend />
            {products.filter(product => visibleProducts.has(product.id)).map(product => (
              <Line
                key={product.id}
                type="monotone"
                dataKey={product.id}
                stroke={product.color}
                strokeWidth={2}
                dot={{ fill: product.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: product.color, strokeWidth: 2 }}
                name={product.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Information Card */}
      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-base">
            <Info className="h-4 w-4" />
            <span>Información del Cálculo</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription>
            Este gráfico muestra la concentración estimada de productos en el cuerpo basada en el modelo de vida media. 
            Los cálculos utilizan una función exponencial de decaimiento: C(t) = C₀ × e^(-λt), donde λ = ln(2)/t½. 
            El rango por defecto muestra 3.5 días hacia atrás y 3.5 días hacia adelante desde el momento actual.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};