import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Medication, Dose } from './MedicationDashboard';

interface ConcentrationChartProps {
  medications: Medication[];
  doses: Dose[];
}

interface ChartDataPoint {
  time: number; // hours from now
  timeLabel: string;
  [medicationId: string]: number | string;
}

// Calculate concentration based on exponential decay: C(t) = C0 * e^(-λt)
// where λ = ln(2) / half-life
const calculateConcentration = (initialDose: number, halfLife: number, timeElapsed: number): number => {
  const lambda = Math.log(2) / halfLife;
  return initialDose * Math.exp(-lambda * timeElapsed);
};

export const ConcentrationChart = ({ medications, doses }: ConcentrationChartProps) => {
  const chartData = useMemo(() => {
    if (medications.length === 0 || doses.length === 0) return [];

    const now = Date.now();
    const hoursBack = 24; // Show 24 hours of history
    const hoursForward = 48; // Show 48 hours of future projection
    const dataPoints = 100; // Number of data points
    
    const data: ChartDataPoint[] = [];

    // Generate time points from -hoursBack to +hoursForward
    for (let i = 0; i <= dataPoints; i++) {
      const timeFromNow = (i / dataPoints) * (hoursBack + hoursForward) - hoursBack;
      const timePoint = now + timeFromNow * 60 * 60 * 1000;
      
      const dataPoint: ChartDataPoint = {
        time: timeFromNow,
        timeLabel: timeFromNow === 0 ? 'Ahora' : 
                  timeFromNow > 0 ? `+${Math.round(timeFromNow)}h` : 
                  `${Math.round(timeFromNow)}h`
      };

      // Calculate concentration for each medication
      medications.forEach(medication => {
        const medicationDoses = doses.filter(d => d.medicationId === medication.id);
        let totalConcentration = 0;

        medicationDoses.forEach(dose => {
          const doseTime = dose.timestamp.getTime();
          const hoursElapsed = (timePoint - doseTime) / (1000 * 60 * 60);
          
          if (hoursElapsed >= 0) {
            // Only calculate if the dose has already been taken at this time point
            totalConcentration += calculateConcentration(dose.amount, medication.halfLife, hoursElapsed);
          }
        });

        dataPoint[medication.id] = Math.max(0, totalConcentration);
      });

      data.push(dataPoint);
    }

    return data;
  }, [medications, doses]);

  const formatTooltip = (value: any, name: string) => {
    const medication = medications.find(m => m.id === name);
    if (medication && typeof value === 'number') {
      return [`${value.toFixed(2)} mg`, medication.name];
    }
    return [value, name];
  };

  const formatXAxisLabel = (value: number) => {
    if (value === 0) return 'Ahora';
    if (value > 0) return `+${Math.round(value)}h`;
    return `${Math.round(value)}h`;
  };

  if (medications.length === 0 || doses.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="space-y-4">
          <div className="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
            <span className="text-2xl">📊</span>
          </div>
          <div>
            <h3 className="font-medium text-lg">No hay datos para mostrar</h3>
            <p className="text-muted-foreground">
              {medications.length === 0 
                ? "Agrega medicamentos y registra dosis para ver la gráfica de concentración"
                : "Registra algunas dosis para ver la gráfica de concentración"
              }
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {medications.map(medication => {
          const medicationDoses = doses.filter(d => d.medicationId === medication.id);
          const totalDoses = medicationDoses.length;
          const totalAmount = medicationDoses.reduce((sum, dose) => sum + dose.amount, 0);
          
          return (
            <Badge key={medication.id} variant="outline" className="flex items-center space-x-2 px-3 py-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: medication.color }}
              />
              <span className="font-medium">{medication.name}</span>
              <span className="text-muted-foreground">
                ({totalDoses} dosis, {totalAmount}mg total)
              </span>
            </Badge>
          );
        })}
      </div>

      {/* Chart */}
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="time" 
              tickFormatter={formatXAxisLabel}
              stroke="hsl(var(--foreground))"
              fontSize={12}
            />
            <YAxis 
              label={{ value: 'Concentración (mg)', angle: -90, position: 'insideLeft' }}
              stroke="hsl(var(--foreground))"
              fontSize={12}
            />
            <Tooltip 
              formatter={formatTooltip}
              labelFormatter={(value) => `Tiempo: ${formatXAxisLabel(Number(value))}`}
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
                color: 'hsl(var(--card-foreground))'
              }}
            />
            <Legend />
            {medications.map(medication => (
              <Line
                key={medication.id}
                type="monotone"
                dataKey={medication.id}
                stroke={medication.color}
                strokeWidth={2}
                dot={{ fill: medication.color, strokeWidth: 0, r: 3 }}
                activeDot={{ r: 5, stroke: medication.color, strokeWidth: 2 }}
                name={medication.name}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Info */}
      <Card className="p-4 bg-accent/50">
        <div className="space-y-2">
          <p className="text-sm font-medium">Información de la gráfica:</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• La concentración se calcula usando la fórmula: C(t) = C₀ × e^(-λt)</li>
            <li>• λ (constante de eliminación) = ln(2) / vida media</li>
            <li>• Se muestra 24h de historial y 48h de proyección</li>
            <li>• Las concentraciones de múltiples dosis del mismo medicamento se suman</li>
          </ul>
        </div>
      </Card>
    </div>
  );
};