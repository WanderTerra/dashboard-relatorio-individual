import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Filter } from 'lucide-react';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import MonthlyComparisonChart from '../components/MonthlyComparisonChart';
import PageHeader from '../components/PageHeader';
import { Combobox } from '../components/ui/select-simple';
import { getMixedKpis, getMixedTrend, getMixedTrendAllMonths, getMixedCarteirasFromAvaliacoes } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import AcordosDashboard from '../components/dashboard/AcordosDashboard';

const Dashboard: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();

  // Buscar carteiras únicas das tabelas mistas (avaliacoes + avaliacoes_uploads)
  const { data: carteirasRaw = [] } = useQuery({
    queryKey: ['carteiras-mixed'],
    queryFn: getMixedCarteirasFromAvaliacoes,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Transformar carteiras para o formato esperado pelo Combobox
  const carteiras = carteirasRaw.map((item: { carteira: string }) => ({
    value: item.carteira,
    label: item.carteira
  }));

  // Construir objeto de filtros para a API (incluindo apenas parâmetros com valores)
  const apiFilters = { 
    ...(filters.start ? { start: filters.start } : {}),
    ...(filters.end ? { end: filters.end } : {}),
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };

  // KPIs e tendência mistos
  const { data: kpis } = useQuery({ 
    queryKey: ['mixed-kpis', apiFilters], 
    queryFn: () => getMixedKpis(apiFilters) 
  });
  const { data: trend } = useQuery({ 
    queryKey: ['mixed-trend', apiFilters], 
    queryFn: () => getMixedTrend(apiFilters) 
  });
  
  // Dados de tendência para o gráfico comparativo mensal (sem filtros de data)
  const { data: trendAllMonths } = useQuery({ 
    queryKey: ['mixed-trend-all-months', { carteira: filters.carteira }], 
    queryFn: () => getMixedTrendAllMonths({ carteira: filters.carteira }) 
  });

  return (
    <div>
      <PageHeader 
        title="Dashboard de Avaliação" 
        subtitle="Análise de performance e qualidade de ligações"
        actions={
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtros</span>
            </div>
            <div className="flex flex-wrap gap-4 items-end">
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 w-3" />
                  Data Início
                </label>
                <input
                  type="date"
                  value={filters.start}
                  onChange={e => setStartDate(e.target.value)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white !text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="flex flex-col">
                <label className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="h-3 w-3" />
                  Data Fim
                </label>
                <input
                  type="date"
                  value={filters.end}
                  onChange={e => setEndDate(e.target.value)}
                  className="h-10 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white !text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div className="min-w-[180px] flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">Carteira</label>
                <Combobox
                  options={carteiras}
                  value={filters.carteira || ''}
                  onChange={(value) => {
                    setCarteira(value);
                  }}
                  placeholder="Selecionar carteira"
                  emptyMessage="Nenhuma carteira encontrada"
                />
              </div>
            </div>
          </div>
        }
      />

      <div className="p-6 space-y-8">
        {/* Cartões de KPI */}
        <KpiCards
          media={kpis?.media_geral ?? null}
          total={kpis?.total_ligacoes ?? 0}
          pior={kpis?.pior_item ?? null}
        />

        {/* Gráfico de linha */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência Temporal</h2>
          <div className="min-h-[500px]">
            <TrendLineChart data={trend ?? []} />
          </div>
        </div>

        {/* Gráfico de comparativo mensal */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparativo Mensal</h2>
          <p className="text-sm text-gray-600 mb-6">
            Análise da média mensal de pontuação das ligações (incluindo uploads) - Histórico completo
          </p>
          <MonthlyComparisonChart trendData={trendAllMonths ?? []} />
        </div>

        {/* Seção de métricas de acordos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Efetividade - Acordos</h2>
          <AcordosDashboard start={filters.start} end={filters.end} carteira={filters.carteira || undefined} />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
