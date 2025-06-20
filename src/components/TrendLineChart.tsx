import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
  data: { dia: string; media: number }[];
}

const TrendLineChart: React.FC<Props> = ({ data }) => (
  <div className="h-72">
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="dia" />
        <YAxis domain={[0, 100]} />
        <Tooltip />
        <Line type="monotone" dataKey="media" stroke="#3b82f6" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default TrendLineChart;
