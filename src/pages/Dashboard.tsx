import React, { useState } from 'react';
import { formatISO } from 'date-fns';
import { useQuery } from '@tanstack/react-query';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import AgentsTable from '../components/AgentsTable';
import { getKpis, getTrend, getAgents, Filters } from '../lib/api';

const today  = new Date();
const first  = new Date(today.getFullYear(), today.getMonth(), 1);

const Dashboard: React.FC = () => {
  const [start, setStart]     = useState(formatISO(first,  { representation: 'date' }));
  const [end,   setEnd]       = useState(formatISO(today,  { representation: 'date' }));
  const [carteira, setCart]   = useState('');

  const filters: Filters = { start, end, ...(carteira ? { carteira } : {}) };

  const { data: kpis }    = useQuery({ queryKey: ['kpis',   filters], queryFn: () => getKpis(filters) });
  const { data: trend }   = useQuery({ queryKey: ['trend',  filters], queryFn: () => getTrend(filters) });
  const { data: agents }  = useQuery({ queryKey: ['agents', filters], queryFn: () => getAgents(filters) });

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Avaliação de Ligações</h1>

      {/* filtros */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-xs">Início</label>
          <input type="date" value={start} onChange={e => setStart(e.target.value)} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-xs">Fim</label>
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} className="border rounded p-1" />
        </div>
        <div>
          <label className="block text-xs">Carteira</label>
          <input type="text" value={carteira} onChange={e => setCart(e.target.value)} className="border rounded p-1" />
        </div>
      </div>

      <KpiCards
        media={kpis?.media_geral ?? null}
        total={kpis?.total_ligacoes ?? 0}
        pior={kpis?.pior_item ?? null}
      />

      <TrendLineChart data={trend ?? []} />

      <AgentsTable agents={agents ?? []} filters={filters as any} />
    </div>
  );
};

export default Dashboard;
