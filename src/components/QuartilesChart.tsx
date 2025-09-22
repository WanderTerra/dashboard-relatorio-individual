import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, Target } from 'lucide-react';

interface QuartilesData {
  quartil: string;
  valor: number;
  cor: string;
  descricao: string;
}

interface QuartilesChartProps {
  data: QuartilesData[];
  tipo: 'desempenho' | 'acordos';
  periodo: string;
}

const QuartilesChart: React.FC<QuartilesChartProps> = ({ data, tipo, periodo }) => {
  const getTipoLabel = () => {
    return tipo === 'desempenho' ? 'Desempenho na Avaliação' : 'Taxa de Acordos';
  };

  const getTipoIcon = () => {
    return tipo === 'desempenho' ? <TrendingUp className="h-4 w-4" /> : <Target className="h-4 w-4" />;
  };

  const getUnidade = () => {
    return tipo === 'desempenho' ? 'pontos' : '%';
  };

  const formatTooltipValue = (value: number) => {
    if (tipo === 'desempenho') {
      return `${value.toFixed(1)} pontos`;
    } else {
      return `${value.toFixed(1)}%`;
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {getTipoIcon()}
          <h3 className="text-lg font-semibold text-gray-900">{getTipoLabel()}</h3>
        </div>
        <div className="text-sm text-gray-600">
          Período: {periodo}
        </div>
      </div>

      {/* Gráfico */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="horizontal"
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <XAxis 
              type="number" 
              domain={[0, tipo === 'desempenho' ? 100 : 100]}
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              tickFormatter={(value) => `${value}${getUnidade()}`}
            />
            <YAxis 
              type="category" 
              dataKey="quartil"
              tick={{ fontSize: 12, fill: '#6b7280' }}
              axisLine={{ stroke: '#e5e7eb' }}
              tickLine={{ stroke: '#e5e7eb' }}
              width={80}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                      <p className="font-semibold text-gray-900">{data.quartil}</p>
                      <p className="text-sm text-gray-600">{data.descricao}</p>
                      <p className="text-sm font-medium" style={{ color: data.cor }}>
                        Valor: {formatTooltipValue(data.valor)}
                      </p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="valor" radius={[0, 4, 4, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.cor} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legenda dos Quartis */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {data.map((item, index) => (
          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <div 
              className="w-3 h-3 rounded-full" 
              style={{ backgroundColor: item.cor }}
            />
            <div>
              <p className="text-sm font-medium text-gray-900">{item.quartil}</p>
              <p className="text-xs text-gray-600">{formatTooltipValue(item.valor)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default QuartilesChart;
