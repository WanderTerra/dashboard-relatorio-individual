import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getQuartisDesempenho, getQuartisAcordos, getMixedCarteirasFromAvaliacoes, type QuartisResponse, type AgenteQuartil } from '../lib/api';
import { Calendar, Filter, TrendingUp, Target, Users, Award, Trophy } from 'lucide-react';
import { Combobox } from './ui/select-simple';

interface QuartilesSectionProps {
  start?: string;
  end?: string;
  carteira?: string;
}

const QuartilesSection: React.FC<QuartilesSectionProps> = ({ start, end, carteira }) => {
  const [tipoQuartis, setTipoQuartis] = useState<'desempenho' | 'acordos'>('desempenho');
  const [filtroStart, setFiltroStart] = useState<string>(start || '');
  const [filtroEnd, setFiltroEnd] = useState<string>(end || '');
  const [filtroCarteira, setFiltroCarteira] = useState<string>(carteira || '');

  // Buscar carteiras para filtro
  const { data: carteirasRaw = [] } = useQuery({
    queryKey: ['carteiras-mixed'],
    queryFn: getMixedCarteirasFromAvaliacoes,
    staleTime: 5 * 60 * 1000,
  });

  const carteiras = carteirasRaw.map((item: { carteira: string }) => ({
    value: item.carteira,
    label: item.carteira
  }));

  const params = { 
    ...(filtroStart ? { start: filtroStart } : {}), 
    ...(filtroEnd ? { end: filtroEnd } : {}), 
    ...(filtroCarteira ? { carteira: filtroCarteira } : {}) 
  };

  // Query para dados de desempenho
  const { data: quartisDesempenho, isLoading: loadingDesempenho } = useQuery({
    queryKey: ['quartis-desempenho', params],
    queryFn: async () => {
      try {
        return await getQuartisDesempenho(params);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para quartis de desempenho - usuário sem permissão');
        }
        return null;
      }
    },
    enabled: tipoQuartis === 'desempenho',
    retry: false
  });

  // Query para dados de acordos
  const { data: quartisAcordos, isLoading: loadingAcordos } = useQuery({
    queryKey: ['quartis-acordos', params],
    queryFn: async () => {
      try {
        return await getQuartisAcordos(params);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para quartis de acordos - usuário sem permissão');
        }
        return null;
      }
    },
    enabled: tipoQuartis === 'acordos',
    retry: false
  });

  const isLoading = loadingDesempenho || loadingAcordos;
  const currentData: QuartisResponse | undefined = tipoQuartis === 'desempenho' ? quartisDesempenho : quartisAcordos;

  const getQuartilInfo = (quartil: 'q1' | 'q2' | 'q3' | 'q4') => {
    if (!currentData) return { titulo: '', cor: '', descricao: '', agentes: [] };
    
    const cores = {
      q1: { bg: 'from-green-50 to-green-100', border: 'border-green-200', text: 'text-green-900', icon: '🥇' },
      q2: { bg: 'from-blue-50 to-blue-100', border: 'border-blue-200', text: 'text-blue-900', icon: '🥈' },
      q3: { bg: 'from-yellow-50 to-yellow-100', border: 'border-yellow-200', text: 'text-yellow-900', icon: '🥉' },
      q4: { bg: 'from-red-50 to-red-100', border: 'border-red-200', text: 'text-red-900', icon: '⚠️' }
    };

    const titulos = {
      q1: 'QUARTIL 1',
      q2: 'QUARTIL 2', 
      q3: 'QUARTIL 3',
      q4: 'QUARTIL 4'
    };

    const descricoes = {
      q1: 'Melhores agentes',
      q2: 'Agentes acima da mediana',
      q3: 'Agentes abaixo da mediana', 
      q4: 'Agentes com menor performance'
    };

    return {
      titulo: titulos[quartil],
      cor: cores[quartil],
      descricao: descricoes[quartil],
      agentes: currentData[quartil]?.agentes || []
    };
  };

  const formatValue = (agente: AgenteQuartil) => {
    if (tipoQuartis === 'desempenho') {
      return `${agente.media_pontuacao?.toFixed(1) || 0} pts`;
    } else {
      return `${agente.taxa_acordo?.toFixed(1) || 0}%`;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
      {/* Header com filtros */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Análise de Quartis por Agentes</h2>
          
          {/* Filtro de tipo */}
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Tipo:</label>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTipoQuartis('desempenho')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  tipoQuartis === 'desempenho'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                Desempenho
              </button>
              <button
                onClick={() => setTipoQuartis('acordos')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                  tipoQuartis === 'acordos'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Target className="h-4 w-4" />
                Acordos
              </button>
            </div>
          </div>
        </div>

        {/* Filtros específicos */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filtros dos Quartis</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Início</label>
              <input
                type="date"
                value={filtroStart}
                onChange={(e) => setFiltroStart(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Fim</label>
              <input
                type="date"
                value={filtroEnd}
                onChange={(e) => setFiltroEnd(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Carteira</label>
              <Combobox
                options={carteiras}
                value={filtroCarteira}
                onChange={setFiltroCarteira}
                placeholder="Selecionar carteira"
                emptyMessage="Nenhuma carteira encontrada"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : currentData ? (
        <div className="space-y-6">
          {/* Cards dos Quartis */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['q1', 'q2', 'q3', 'q4'] as const).map((quartil) => {
              const info = getQuartilInfo(quartil);
              return (
                <div key={quartil} className={`bg-gradient-to-br ${info.cor.bg} rounded-lg border-2 ${info.cor.border} p-4`}>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className={`font-bold text-lg ${info.cor.text}`}>
                      {info.icon} {info.titulo}
                    </h3>
                    <span className={`text-sm font-semibold ${info.cor.text}`}>
                      {currentData[quartil]?.valor?.toFixed(1) || 0}{tipoQuartis === 'desempenho' ? ' pts' : '%'}
                    </span>
                  </div>
                  
                  <p className={`text-sm ${info.cor.text} mb-3`}>{info.descricao}</p>
                  
                  <div className="space-y-2">
                    {info.agentes.length > 0 ? (
                      info.agentes.map((agente, index) => (
                        <div key={agente.agent_id} className={`bg-white bg-opacity-50 rounded p-2 ${info.cor.text}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium">#{agente.posicao}</span>
                              <span className="text-sm font-medium truncate">{agente.nome_agente}</span>
                            </div>
                            <span className="text-xs font-semibold">{formatValue(agente)}</span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {agente.total_ligacoes} ligações
                            {tipoQuartis === 'acordos' && agente.acordos && ` • ${agente.acordos} acordos`}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-sm ${info.cor.text} text-center py-2`}>
                        Nenhum agente neste quartil
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Resumo do período */}
          <div className="bg-gray-50 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-600">
              <Calendar className="inline h-4 w-4 mr-1" />
              Período: {currentData.periodo}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Nenhum dado disponível para o período selecionado</p>
        </div>
      )}
    </div>
  );
};

export default QuartilesSection;
