import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRelatorioProdutividade, type RelatorioProdutividade, getCarteirasFromAvaliacoes } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import { exportRelatorioProdutividade, exportResumoProdutividade } from '../lib/export-utils';
import { Download, TrendingUp, Users, Phone, Clock, Filter } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import PageHeader from '../components/PageHeader';
import PeriodFilter from '../components/PeriodFilter';
import { Combobox } from '../components/ui/select-simple';
import { cn } from '../lib/utils';

const RelatorioProdutividadePage: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();

  const { data: relatorio, error, refetch } = useQuery({
    queryKey: ['relatorio-produtividade', filters],
    queryFn: () => getRelatorioProdutividade(filters),
    enabled: true,
  });

  const { data: carteiras = [], error: carteirasError } = useQuery({
    queryKey: ['carteiras-avaliacoes'],
    queryFn: getCarteirasFromAvaliacoes,
    enabled: true,
  });

  const handleExport = () => {
    if (!relatorio) {
      alert('Nenhum dado disponível para exportar');
      return;
    }
    exportRelatorioProdutividade(relatorio);
  };

  const handleExportResumo = () => {
    if (!relatorio) {
      alert('Nenhum dado disponível para exportar');
      return;
    }
    exportResumoProdutividade(relatorio);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar relatório: {error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader 
        title="Relatório de Produtividade" 
        subtitle={
          <>
            Análise de produtividade dos agentes por período
            {relatorio?.periodo.inicio && relatorio?.periodo.fim && (
              <span className="ml-2 text-sm text-gray-500">
                ({formatDate(relatorio.periodo.inicio)} - {formatDate(relatorio.periodo.fim)})
              </span>
            )}
          </>
        }
        breadcrumbs={[
          { label: 'Relatórios', href: '/relatorios' },
          { label: 'Produtividade', isActive: true }
        ]}
        actions={
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExport}
              disabled={!relatorio}
              className={cn(
                "inline-flex items-center gap-3 px-6 py-3",
                "bg-gradient-to-r from-blue-600 to-indigo-600",
                "hover:from-blue-700 hover:to-indigo-700",
                "text-white rounded-xl transition-all duration-300",
                "shadow-lg hover:shadow-xl",
                "transform hover:-translate-y-0.5",
                "font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              )}
            >
              <Download className="h-5 w-5" />
              Exportar CSV
            </button>
            <button
              onClick={handleExportResumo}
              disabled={!relatorio}
              className={cn(
                "inline-flex items-center gap-3 px-6 py-3",
                "bg-gradient-to-r from-green-600 to-emerald-600",
                "hover:from-green-700 hover:to-emerald-700",
                "text-white rounded-xl transition-all duration-300",
                "shadow-lg hover:shadow-xl",
                "transform hover:-translate-y-0.5",
                "font-medium",
                "disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg"
              )}
            >
              <Download className="h-5 w-5" />
              Resumo CSV
            </button>
          </div>
        }
      />

      <div className="p-6 space-y-6">
        {/* Filtros */}
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
                onChange={(value) => setCarteira(value)}
                placeholder="Todas as carteiras"
                emptyMessage="Nenhuma carteira encontrada"
              />
            </div>
          </div>
        </div>

      {relatorio && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-sm">
                  <Phone className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Ligações</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.total_ligacoes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-sm">
                  <Users className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.total_agentes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl shadow-sm">
                  <TrendingUp className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Média por Agente</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.media_ligacoes_agente}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl shadow-sm">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Período</p>
                  <p className="text-sm font-bold text-gray-900">
                    {relatorio.periodo.inicio ? formatDate(relatorio.periodo.inicio) : 'N/A'} - 
                    {relatorio.periodo.fim ? formatDate(relatorio.periodo.fim) : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Top Performers */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top Performers</h2>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              {relatorio.resumo.top_performers.map((agent, index) => (
                <div key={agent.agent_id} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">#{index + 1}</div>
                  <div className="font-medium text-gray-900">{agent.nome_agente}</div>
                  <div className="text-sm text-gray-600">{agent.total_ligacoes} ligações</div>
                </div>
              ))}
            </div>
          </div>

          {/* Gráfico de Evolução */}
          {relatorio.evolucao_periodo.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução da Produtividade</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={relatorio.evolucao_periodo}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="total_ligacoes" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabela de Agentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Produtividade por Agente</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Ligações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hoje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Esta Semana
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Este Mês
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Ligação
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorio.agentes.map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.nome_agente}</div>
                        <div className="text-sm text-gray-500">{agent.agent_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.total_ligacoes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.ligacoes_hoje}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.ligacoes_semana}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.ligacoes_mes}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(agent.ultima_ligacao)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!relatorio && !error && (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando relatório...</p>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default RelatorioProdutividadePage;
