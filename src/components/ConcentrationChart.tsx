import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, TrendingUp, Info } from 'lucide-react';
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

export const ConcentrationChart = ({ products, quantities }: ConcentrationChartProps) => {
  const chartData = useMemo(() => {
    if (products.length === 0 || quantities.length === 0) return [];

    // Create time points for the last 24 hours and next 48 hours
    const now = Date.now();
    const dataPoints: ChartDataPoint[] = [];
    
    // Generate time points every 2 hours for 72 hours total (24 past + 48 future)
    for (let i = -24; i <= 48; i += 2) {
      const timePoint = now + (i * 60 * 60 * 1000); // i hours from now
      const timeLabel = new Date(timePoint).toLocaleDateString('es-ES', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit'
      });

      const dataPoint: ChartDataPoint = {
        time: timePoint,
        timeLabel
      };

      // Calculate concentration for each product
      products.forEach(product => {
        const productQuantities = quantities.filter(q => q.productId === product.id);
        let totalConcentration = 0;

        // Sum concentrations from all quantities of this product
        productQuantities.forEach(quantity => {
          const quantityTime = quantity.timestamp.getTime();
          const hoursElapsed = (timePoint - quantityTime) / (1000 * 60 * 60);
          
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
  }, [products, quantities]);

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
      {/* Product Legend */}
      <div className="flex flex-wrap gap-2">
        {products.map(product => {
          const productQuantities = quantities.filter(q => q.productId === product.id);
          const totalQuantities = productQuantities.length;
          const totalAmount = productQuantities.reduce((sum, quantity) => sum + quantity.amount, 0);
          
          return (
            <Badge key={product.id} variant="outline" className="flex items-center space-x-2 px-3 py-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: product.color }}
              />
              <span className="font-medium">{product.name}</span>
              <span className="text-muted-foreground">
                ({totalQuantities} cantidades, {totalAmount}mg total)
              </span>
            </Badge>
          );
        })}
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
            {products.map(product => (
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
            La visualización abarca 24 horas pasadas y 48 horas futuras desde el momento actual.
          </CardDescription>
        </CardContent>
      </Card>
    </div>
  );
};