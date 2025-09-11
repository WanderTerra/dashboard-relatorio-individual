import React from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart,
  ReferenceLine
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { formatDate } from '../lib/format';

interface Props {
  data: { dia: string; media: number }[];
}

const TrendLineChart: React.FC<Props> = ({ data }) => {
  // Calcular tendência (crescimento, decrescimento ou estável)
  const calculateTrend = React.useMemo(() => {
    if (!data || data.length < 2) return 'stable';
    
    const firstValue = data[0]?.media || 0;
    const lastValue = data[data.length - 1]?.media || 0;
    const difference = lastValue - firstValue;
    
    if (difference > 2) return 'up';
    if (difference < -2) return 'down';
    return 'stable';
  }, [data]);

  // Calcular média geral para linha de referência
  const averageValue = React.useMemo(() => {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + item.media, 0);
    return Math.round((sum / data.length) * 10) / 10;
  }, [data]);

  // Usar a função de formatação centralizada

  // Cores baseadas na tendência
  const getTrendColors = () => {
    switch (calculateTrend) {
      case 'up':
        return {
          primary: '#10b981', // emerald-500
          secondary: '#34d399', // emerald-400
          light: '#d1fae5', // emerald-100
          gradient: ['#10b981', '#34d399']
        };
      case 'down':
        return {
          primary: '#ef4444', // red-500
          secondary: '#f87171', // red-400
          light: '#fee2e2', // red-100
          gradient: ['#ef4444', '#f87171']
        };
      default:
        return {
          primary: '#6b7280', // gray-500
          secondary: '#9ca3af', // gray-400
          light: '#f3f4f6', // gray-100
          gradient: ['#6b7280', '#9ca3af']
        };
    }
  };

  const colors = getTrendColors();

  // Dados processados com formatação
  const processedData = React.useMemo(() => {
    return data?.map(item => ({
      ...item,
      dia: formatDate(item.dia),
      media: Math.round(item.media * 10) / 10
    })) || [];
  }, [data]);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <div className="text-3xl mb-3">📊</div>
          <p className="text-lg font-medium">Nenhum dado disponível</p>
          <p className="text-sm text-gray-400">Selecione um período para visualizar a tendência</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header com indicadores */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colors.light}`}>
            {calculateTrend === 'up' ? (
              <TrendingUp className={`h-5 w-5 ${colors.primary}`} />
            ) : calculateTrend === 'down' ? (
              <TrendingDown className={`h-5 w-5 ${colors.primary}`} />
            ) : (
              <Minus className={`h-5 w-5 ${colors.primary}`} />
            )}
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-600">Tendência</h3>
            <p className={`text-lg font-semibold ${colors.primary}`}>
              {calculateTrend === 'up' ? 'Crescimento' : 
               calculateTrend === 'down' ? 'Decrescimento' : 'Estável'}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-sm text-gray-600">Média Geral</p>
          <p className="text-2xl font-bold text-gray-900">{averageValue}%</p>
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={processedData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            {/* Gradiente de fundo */}
            <defs>
              <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.primary} stopOpacity={0.1}/>
                <stop offset="95%" stopColor={colors.primary} stopOpacity={0.01}/>
              </linearGradient>
            </defs>
            
            {/* Grid com estilo moderno */}
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#f1f5f9" 
              strokeWidth={1}
              opacity={0.6}
            />
            
            {/* Eixo X com formatação */}
            <XAxis 
              dataKey="dia" 
              tick={{ 
                fill: '#64748b', 
                fontSize: 12,
                fontWeight: 500
              }}
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              tickLine={false}
              padding={{ left: 20, right: 20 }}
            />
            
            {/* Eixo Y com formatação */}
            <YAxis 
              domain={[0, 100]} 
              tick={{ 
                fill: '#64748b', 
                fontSize: 12,
                fontWeight: 500
              }}
              axisLine={{ stroke: '#e2e8f0', strokeWidth: 1 }}
              tickLine={false}
              tickFormatter={(value) => `${value}%`}
              padding={{ top: 20, bottom: 20 }}
            />
            
            {/* Linha de referência da média */}
            <ReferenceLine 
              y={averageValue} 
              stroke="#94a3b8" 
              strokeDasharray="3 3"
              strokeWidth={1.5}
              label={{
                value: `Média: ${averageValue}%`,
                position: 'insideTopRight',
                fill: '#64748b',
                fontSize: 11,
                fontWeight: 500
              }}
            />
            
            {/* Tooltip personalizado */}
            <Tooltip 
              contentStyle={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                padding: '12px 16px'
              }}
              labelStyle={{
                color: '#1e293b',
                fontWeight: 600,
                fontSize: 14
              }}
              formatter={(value: any) => [`${value}%`, 'Pontuação']}
              labelFormatter={(label) => `Data: ${label}`}
            />
            
            {/* Área com gradiente */}
            <Area
              type="monotone"
              dataKey="media"
              stroke={colors.primary}
              strokeWidth={3}
              fill="url(#colorGradient)"
              dot={{
                fill: colors.primary,
                stroke: '#ffffff',
                strokeWidth: 3,
                r: 6,
                opacity: 1
              }}
              activeDot={{
                r: 8,
                stroke: colors.primary,
                strokeWidth: 3,
                fill: '#ffffff'
              }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Estatísticas adicionais */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
        <div className="text-center">
          <p className="text-sm text-gray-600">Período</p>
          <p className="text-lg font-semibold text-gray-900">
            {processedData.length} dias
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Melhor Dia</p>
          <p className="text-lg font-semibold text-green-600">
            {Math.max(...processedData.map(d => d.media))}%
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600">Variação</p>
          <p className={`text-lg font-semibold ${
            calculateTrend === 'up' ? 'text-green-600' : 
            calculateTrend === 'down' ? 'text-red-600' : 'text-gray-600'
          }`}>
            {processedData.length > 1 ? 
              `${(processedData[processedData.length - 1].media - processedData[0].media).toFixed(1)}%` : 
              '0%'
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default TrendLineChart;
