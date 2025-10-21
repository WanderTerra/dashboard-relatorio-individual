import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Calendar, Filter } from 'lucide-react';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import MonthlyComparisonChart from '../components/MonthlyComparisonChart';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import { Combobox } from '../components/ui/select-simple';
import { getMixedKpis, getMixedTrend, getMixedTrendAllMonths, getCarteirasFromAvaliacoes, getMixedAgentsCount } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import AcordosDashboard from '../components/dashboard/AcordosDashboard';
import QuartilesSection from '../components/QuartilesSection';

const Dashboard: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();

  // Buscar carteiras únicas das tabelas mistas (avaliacoes + avaliacoes_uploads)
  const { data: carteiras = [] } = useQuery({
    queryKey: ['carteiras-avaliacoes'],
    queryFn: getCarteirasFromAvaliacoes,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Construir objeto de filtros para a API (incluindo apenas parâmetros com valores)
  const apiFilters = { 
    ...(filters.start ? { start: filters.start } : {}),
    ...(filters.end ? { end: filters.end } : {}),
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };

  // Filtros para o gráfico comparativo mensal (sem filtros de data)
  const apiFiltersNoDate = { 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };


  // KPIs e tendência mistos
  const { data: kpis } = useQuery({ 
    queryKey: ['mixed-kpis', apiFilters], 
    queryFn: async () => {
      try {
        return await getMixedKpis(apiFilters);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para KPIs mistos - usuário sem permissão');
        }
        return null;
      }
    },
    retry: false
  });
  const { data: trend } = useQuery({ 
    queryKey: ['mixed-trend', apiFilters], 
    queryFn: async () => {
      try {
        return await getMixedTrend(apiFilters);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para tendência mista - usuário sem permissão');
        }
        return [];
      }
    },
    retry: false
  });
  
  // Dados de tendência para o gráfico comparativo mensal (sem filtros de data)
  const { data: trendAllMonths } = useQuery({ 
    queryKey: ['mixed-trend-all-months', apiFiltersNoDate], 
    queryFn: async () => {
      try {
        return await getMixedTrendAllMonths(apiFiltersNoDate);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para tendência mensal - usuário sem permissão');
        }
        return [];
      }
    },
    retry: false
  });
  
  // Número de agentes avaliados
  const { data: agentesCount } = useQuery({ 
    queryKey: ['mixed-agents-count', apiFilters], 
    queryFn: async () => {
      try {
        return await getMixedAgentsCount(apiFilters);
      } catch (error: any) {
        if (error?.response?.status === 403) {
          console.warn('⚠️ Acesso negado para contagem de agentes - usuário sem permissão');
        }
        return 0;
      }
    },
    retry: false
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
              <PeriodFilter
                startDate={filters.start || ''}
                endDate={filters.end || ''}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
              />
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
          agentesCount={agentesCount ?? null}
        />

        {/* Gráficos lado a lado */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de comparativo mensal */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Comparativo Mensal</h2>
            <p className="text-sm text-gray-600 mb-6">
              Análise da média mensal de pontuação das ligações (incluindo uploads) - Histórico completo
            </p>
          <MonthlyComparisonChart trendData={trendAllMonths ?? trend ?? []} />
          </div>

          {/* Gráfico de linha */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Tendência Temporal</h2>
            <TrendLineChart data={trend ?? []} />
          </div>
        </div>

        {/* Seção de métricas de acordos */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-shadow duration-300">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Efetividade - Acordos</h2>
          <AcordosDashboard 
            start={filters.start || undefined} 
            end={filters.end || undefined} 
            carteira={filters.carteira || undefined} 
          />
        </div>

        {/* Seção de análise de quartis */}
        <QuartilesSection 
          start={filters.start || undefined} 
          end={filters.end || undefined} 
          carteira={filters.carteira || undefined} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
