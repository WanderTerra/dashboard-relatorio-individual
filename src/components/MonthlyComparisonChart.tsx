import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';

interface TrendData {
  dia: string;
  media: number;
}

interface MonthlyComparisonChartProps {
  trendData: TrendData[];
}

const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({ trendData }) => {

  // Processar dados da tendência para criar comparativo mensal
  const monthlyData = React.useMemo(() => {
    if (!trendData || trendData.length === 0) return [];

    // Agrupar por mês e calcular média mensal
    const monthlyGroups = trendData.reduce((acc, item) => {
      let month: string;
      
      // Tentar diferentes formatos de data
      if (item.dia.includes('-')) {
        // Formato YYYY-MM-DD ou YYYY-MM
        month = item.dia.substring(0, 7);
      } else if (item.dia.includes('/')) {
        // Formato DD/MM/YYYY ou MM/YYYY
        const parts = item.dia.split('/');
        if (parts.length === 3) {
          month = `${parts[2]}-${parts[1].padStart(2, '0')}`;
        } else if (parts.length === 2) {
          month = `${parts[1]}-${parts[0].padStart(2, '0')}`;
        } else {
          return acc; // Formato inválido, pular
        }
      } else {
        return acc; // Formato não reconhecido, pular
      }

      if (!acc[month]) {
        acc[month] = { mes: month, total: 0, count: 0 };
      }
      acc[month].total += item.media;
      acc[month].count += 1;
      return acc;
    }, {} as Record<string, { mes: string; total: number; count: number }>);

    // Calcular média mensal e formatar
    const result = Object.values(monthlyGroups)
      .map(({ mes, total, count }) => {
        const [year, month] = mes.split('-');
        return {
          mes: `${month}/${year}`, // MM/YYYY
          media: Math.round((total / count) * 10) / 10 // Arredondar para 1 decimal
        };
      })
      .sort((a, b) => {
        // Ordenar cronologicamente
        const [monthA, yearA] = a.mes.split('/');
        const [monthB, yearB] = b.mes.split('/');
        return new Date(parseInt(yearA), parseInt(monthA) - 1).getTime() - 
               new Date(parseInt(yearB), parseInt(monthB) - 1).getTime();
      });

    return result;
  }, [trendData]);

  if (!trendData || trendData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">📊</div>
          <p>Nenhum dado disponível para comparação mensal</p>
          <p className="text-sm mt-2">Os dados são extraídos do gráfico de tendência temporal</p>
        </div>
      </div>
    );
  }

  if (monthlyData.length === 0) {
    return (
      <div className="flex items-center justify-center h-80 text-gray-500">
        <div className="text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <p>Não foi possível processar os dados para comparação mensal</p>
        </div>
      </div>
    );
  }


  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart 
          data={monthlyData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis 
            dataKey="mes" 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis 
            domain={[0, 100]} 
            tick={{ fill: '#6b7280', fontSize: 12 }}
            axisLine={{ stroke: '#e5e7eb' }}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip 
            formatter={(value) => [`${value}%`, 'Média Mensal']}
            labelFormatter={(label) => `Mês: ${label}`}
            contentStyle={{ 
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '0.375rem',
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
            }}
          />
          <Legend />
          <Bar 
            dataKey="media" 
            fill="#3b82f6" 
            radius={[4, 4, 0, 0]}
            name="Média Mensal"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default MonthlyComparisonChart;