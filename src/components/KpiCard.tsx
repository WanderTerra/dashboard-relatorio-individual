import React from 'react';

interface Props {
  label: string;
  value: string | number | null;
  intent?: 'success' | 'warning' | 'danger';
}

const getColorClass = (value: string | number | null, label: string): string => {
  // Para o card de "Pontuação média", aplica cores condicionais baseadas no valor
  if (label === "Pontuação média" && typeof value === 'number') {
    if (value >= 70) {
      return 'bg-green-50 text-green-600 ring-green-300';
    } else {
      return 'bg-red-50 text-red-600 ring-red-300';
    }
  }
  
  // Para outros cards, usa cor neutra
  return 'bg-gray-50 text-gray-700 ring-gray-300';
};

const KpiCard: React.FC<Props> = ({ label, value }) => {
  const colorClass = getColorClass(value, label);
  
  return (
    <div className={`flex flex-col gap-2 rounded-xl p-4 shadow-sm ring-1 min-h-[100px] ${colorClass}`}>
      <span className="text-xs font-medium uppercase tracking-wide">
        {label}
      </span>
      <span className="text-2xl lg:text-3xl font-extrabold leading-tight break-words">
        {typeof value === 'number' && label === "Pontuação média" 
          ? `${value.toFixed(1)}%` 
          : value ?? '-'
        }
      </span>
    </div>
  );
};

export default KpiCard;
