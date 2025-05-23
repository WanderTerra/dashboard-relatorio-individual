import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface MonthlyChartProps {
  data: Array<{
    name: string;
    score: number;
  }>;
}

const MonthlyChart: React.FC<MonthlyChartProps> = ({ data }) => {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{
          top: 5,
          right: 30,
          left: 20,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis 
          dataKey="name" 
          tick={{ fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
        />
        <YAxis 
          domain={[0, 100]} 
          tick={{ fill: '#6b7280' }}
          axisLine={{ stroke: '#e5e7eb' }}
          tickFormatter={(value) => `${value}pts`}
        />
        <Tooltip 
          formatter={(value) => [`${value} pts`, 'Pontuação']}
          labelFormatter={(label) => `Mês: ${label}`}
          contentStyle={{ 
            backgroundColor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '0.375rem',
            boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
          }}
        />
        <Line 
          type="monotone" 
          dataKey="score" 
          stroke="#4f46e5" 
          strokeWidth={3}
          dot={{ 
            fill: '#4f46e5', 
            r: 6,
            strokeWidth: 2,
            stroke: '#fff'
          }}
          activeDot={{ 
            r: 8, 
            stroke: '#4f46e5',
            strokeWidth: 2,
            fill: '#fff'
          }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default MonthlyChart;
