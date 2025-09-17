import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getContestacoesPendentes } from '../lib/api';

interface ContestacoesPendentesButtonProps {
  onClick: () => void;
}

const ContestacoesPendentesButton: React.FC<ContestacoesPendentesButtonProps> = ({ onClick }) => {
  // Buscar contestações pendentes
  const { data: contestacoes = [] } = useQuery({
    queryKey: ['contestacoes-pendentes'],
    queryFn: () => getContestacoesPendentes(),
    refetchInterval: 30000, // Refetch a cada 30 segundos
  });

  const pendingCount = contestacoes.length;

  return (
    <button
      onClick={onClick}
      className={`h-12 px-6 rounded-xl transition-all duration-300 flex items-center gap-3 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 font-medium ${
        pendingCount > 0 
          ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white' 
          : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white'
      }`}
      title="Ver contestações pendentes"
    >
      <AlertTriangle className="h-5 w-5" />
      <span>Contestações ({pendingCount})</span>
    </button>
  );
};

export default ContestacoesPendentesButton;
