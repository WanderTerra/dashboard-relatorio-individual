import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import {
  getAgentSummary,
  getAgentCalls,
  getAgentWorstItem
} from '../lib/api';
import CallList     from '../components/CallList';
import SummaryCard  from '../components/ui/SummaryCard';
import { formatItemName, formatAgentName } from '../lib/format';
import { useFilters } from '../hooks/use-filters';

const AgentDetail: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  if (!agentId) return <div>Agente não especificado.</div>;

  const { filters, setStartDate, setEndDate } = useFilters();

  // Construir objeto de filtros para a API
  const apiFilters = { 
    start: filters.start, 
    end: filters.end, 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };
  
  console.log("Usando filtros do hook:", apiFilters);
    // summary
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['agentSummary', agentId, apiFilters],
    queryFn: () => {
      console.log(`Buscando resumo para agente ${agentId} com filtros:`, apiFilters);
      return getAgentSummary(agentId, apiFilters).then(data => {
        console.log('Dados recebidos do agente:', data);
        return data;
      });
    },
  });

  // calls
  const { data: calls, isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: ['agentCalls', agentId, apiFilters],
    queryFn: () => {
      console.log(`Buscando chamadas para agente ${agentId} com filtros:`, apiFilters);
      return getAgentCalls(agentId, apiFilters);
    },
  });

  // worst item
  const { data: worstItem, isLoading: wiLoading, error: wiError } = useQuery({
    queryKey: ['agentWorstItem', agentId, apiFilters],
    queryFn: () => {
      console.log(`Buscando pior item para agente ${agentId} com filtros:`, apiFilters);
      return getAgentWorstItem(agentId, apiFilters);
    },
  });
  
  // Log de erros
  React.useEffect(() => {
    if (summaryError) console.error('Erro ao buscar resumo:', summaryError);
    if (callsError) console.error('Erro ao buscar chamadas:', callsError);
    if (wiError) console.error('Erro ao buscar pior item:', wiError);
  }, [summaryError, callsError, wiError]);

  return (
    <div className="p-6 space-y-6">
      <Link to="/" className="px-4 py-2 bg-blue-600 text-white rounded">
        ← Voltar
      </Link>      {/* Cabeçalho */}      {summaryLoading
        ? <p>Carregando informações do agente…</p>
        : (          <SummaryCard
            name={formatAgentName(summary)}
            title={`Agente ${agentId}`}
            subtitle=""
            media={summary?.media ?? 0}
            total={summary?.ligacoes ?? 0}
          />
        )
      }      {/* Filtros de data */}
      <div className="flex gap-4">
        <div>
          <label className="block text-xs">Início</label>
          <input
            type="date"
            value={filters.start}
            onChange={e => setStartDate(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-xs">Fim</label>
          <input
            type="date"
            value={filters.end}
            onChange={e => setEndDate(e.target.value)}
            className="border rounded p-1"
          />
        </div>
      </div>

      {/* Pior item */}
      <div className="bg-white p-4 rounded shadow">
        <h2 className="font-semibold mb-2">Pior Item Avaliado</h2>
        {wiLoading
          ? <p>Carregando…</p>
          : worstItem
            ? (              <p>
                <strong>{formatItemName(worstItem.categoria)}</strong> — taxa de não conformidade de{' '}
                {(worstItem.taxa_nao_conforme * 100).toFixed(1)}%
              </p>
            )
            : <p>Sem dados de avaliação.</p>
        }
      </div>

      {/* Lista de ligações */}
      {callsLoading
        ? <p>Carregando chamadas…</p>
        : <CallList calls={calls ?? []} />
      }
    </div>
  );
};

export default AgentDetail;
