import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatISO } from 'date-fns';

import {
  getAgentSummary,
  getAgentCalls,
  getAgentWorstItem,
  Filters
} from '../lib/api';
import CallList     from '../components/CallList';
import SummaryCard  from '../components/ui/SummaryCard';
import { formatItemName } from '../lib/format';

const AgentDetail: React.FC = () => {
  const { agentId } = useParams<{ agentId: string }>();
  if (!agentId) return <div>Agente não especificado.</div>;  // datas padrão - usando período fixo maior para garantir que dados apareçam
  const [start, setStart] = useState("2024-01-01");
  const [end, setEnd]     = useState("2025-12-31");
  const filters: Filters  = { start, end };
  
  console.log("Usando filtros fixos:", filters);// summary
  const { data: summary, isLoading: summaryLoading, error: summaryError } = useQuery({
    queryKey: ['agentSummary', agentId, filters],
    queryFn: () => {
      console.log(`Buscando resumo para agente ${agentId} com filtros:`, filters);
      return getAgentSummary(agentId, filters);
    },
  });

  // calls
  const { data: calls, isLoading: callsLoading, error: callsError } = useQuery({
    queryKey: ['agentCalls', agentId, filters],
    queryFn: () => {
      console.log(`Buscando chamadas para agente ${agentId} com filtros:`, filters);
      return getAgentCalls(agentId, filters);
    },
  });

  // worst item
  const { data: worstItem, isLoading: wiLoading, error: wiError } = useQuery({
    queryKey: ['agentWorstItem', agentId, filters],
    queryFn: () => {
      console.log(`Buscando pior item para agente ${agentId} com filtros:`, filters);
      return getAgentWorstItem(agentId, filters);
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
      </Link>      {/* Cabeçalho */}
      {summaryLoading
        ? <p>Carregando informações do agente…</p>
        : (
          <SummaryCard
            title={summary?.nome ?? `Agente ${agentId}`}
            subtitle={`ID ${agentId}`}
            media={summary?.media ?? 0}
            total={summary?.ligacoes ?? 0}
          />
        )
      }

      {/* Filtros de data */}
      <div className="flex gap-4">
        <div>
          <label className="block text-xs">Início</label>
          <input
            type="date"
            value={start}
            onChange={e => setStart(e.target.value)}
            className="border rounded p-1"
          />
        </div>
        <div>
          <label className="block text-xs">Fim</label>
          <input
            type="date"
            value={end}
            onChange={e => setEnd(e.target.value)}
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
