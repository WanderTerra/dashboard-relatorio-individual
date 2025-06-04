import React from 'react';

interface SummaryCardProps {
  title: string;
  subtitle: string;
  media: number;
  total: number;
  name?: string; // Nome do agente
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, subtitle, media, total, name }) => (
  <div className="bg-white p-4 rounded shadow">
    {name && <h1 className="text-xl font-bold mb-1">{name}</h1>}
    <h2 className={`${name ? 'text-lg' : 'text-xl font-bold'}`}>{title}</h2>
    <p className="text-sm text-gray-600">{subtitle}</p>
    <div className="mt-4 flex space-x-6">
      <div>
        <p className="text-sm text-gray-500">Média geral</p>
        <p className="text-2xl font-semibold">{media.toFixed(1)}</p>
      </div>
      <div>
        <p className="text-sm text-gray-500">Total de ligações</p>
        <p className="text-2xl font-semibold">{total}</p>
      </div>
    </div>
  </div>
);

export default SummaryCard;
