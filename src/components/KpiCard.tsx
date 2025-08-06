import React from 'react';
import { TrendingUp, Phone, AlertTriangle } from 'lucide-react';

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

const getIcon = (label: string) => {
  if (label === "Pontuação média") {
    return <TrendingUp className="h-5 w-5 opacity-60" />;
  } else if (label === "Ligações avaliadas") {
    return <Phone className="h-5 w-5 opacity-60" />;
  } else if (label.includes("Item com maior NC")) {
    return <AlertTriangle className="h-5 w-5 opacity-60" />;
  }
  return null;
};

const KpiCard: React.FC<Props> = ({ label, value }) => {
  const colorClass = getColorClass(value, label);
  
  return (
    <div className={`flex flex-col gap-3 rounded-xl p-6 shadow-lg ring-1 min-h-[120px] hover:shadow-xl transition-shadow duration-300 ${colorClass}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide opacity-80">
          {label}
        </span>
        {getIcon(label)}
      </div>
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
