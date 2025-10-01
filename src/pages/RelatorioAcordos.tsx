import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRelatorioAcordos, type RelatorioAcordos, getCarteirasFromAvaliacoes } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import { exportRelatorioAcordos, exportResumoAcordos } from '../lib/export-utils';
import { Calendar, Download, TrendingUp, Users, MessageSquare, DollarSign, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const RelatorioAcordosPage: React.FC = () => {
  const { filters, setFilters } = useFilters();
  const [isLoading, setIsLoading] = useState(false);

  const { data: relatorio, error, refetch } = useQuery({
    queryKey: ['relatorio-acordos', filters],
    queryFn: () => getRelatorioAcordos(filters),
    enabled: true,
  });

  const { data: carteiras, error: carteirasError } = useQuery({
    queryKey: ['carteiras-avaliacoes'],
    queryFn: getCarteirasFromAvaliacoes,
    enabled: true,
  });

  const handleFilterChange = (newFilters: any) => {
    setFilters(newFilters);
  };

  const handleExport = () => {
    if (!relatorio) {
      alert('Nenhum dado disponível para exportar');
      return;
    }
    exportRelatorioAcordos(relatorio);
  };

  const handleExportResumo = () => {
    if (!relatorio) {
      alert('Nenhum dado disponível para exportar');
      return;
    }
    exportResumoAcordos(relatorio);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'Excelente':
        return 'text-green-600 bg-green-100';
      case 'Bom':
        return 'text-blue-600 bg-blue-100';
      case 'Atenção':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  // Cores para o gráfico de pizza
  const COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'];

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
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Acordos Feitos</h1>
          <p className="text-gray-600 mt-1">
            Análise de negociação e acordos dos agentes
            {relatorio?.periodo.inicio && relatorio?.periodo.fim && (
              <span className="ml-2 text-sm">
                ({formatDate(relatorio.periodo.inicio)} - {formatDate(relatorio.periodo.fim)})
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={20} />
            Exportar CSV
          </button>
          <button
            onClick={handleExportResumo}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Download size={20} />
            Resumo CSV
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Início
            </label>
            <input
              type="date"
              value={filters.start || ''}
              onChange={(e) => handleFilterChange({ ...filters, start: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data Fim
            </label>
            <input
              type="date"
              value={filters.end || ''}
              onChange={(e) => handleFilterChange({ ...filters, end: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Carteira
            </label>
            <select
              value={filters.carteira || ''}
              onChange={(e) => handleFilterChange({ ...filters, carteira: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas as carteiras</option>
              {carteiras?.map((carteira: any) => (
                <option key={carteira.value} value={carteira.value}>
                  {carteira.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {relatorio && (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Agentes</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.total_agentes}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total de Acordos</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.total_acordos}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Acordo</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.taxa_acordo_geral}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <DollarSign className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Valor Total</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(relatorio.resumo.valor_total_acordos)}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Melhores Negociadores */}
          {relatorio.resumo.melhores_negociadores.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Melhores Negociadores</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {relatorio.resumo.melhores_negociadores.map((agent, index) => (
                  <div key={agent.agent_id} className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">#{index + 1}</div>
                    <div className="font-medium text-gray-900">{agent.nome_agente}</div>
                    <div className="text-sm text-green-600 font-semibold">{agent.taxa_acordo}%</div>
                    <div className="text-xs text-gray-500">{agent.total_acordos} acordos</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Motivos de Não Acordo */}
          {relatorio.resumo.motivos_nao_acordo.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Motivos de Não Acordo</h2>
                <div className="space-y-3">
                  {relatorio.resumo.motivos_nao_acordo.map((motivo, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm font-medium text-gray-700">{motivo.motivo_nao_acordo}</span>
                      <span className="text-sm font-bold text-red-600">{motivo.quantidade}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Gráfico de Pizza dos Motivos */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Distribuição dos Motivos</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={relatorio.resumo.motivos_nao_acordo}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ motivo_nao_acordo, quantidade }) => `${motivo_nao_acordo}: ${quantidade}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="quantidade"
                      >
                        {relatorio.resumo.motivos_nao_acordo.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {/* Gráfico de Evolução */}
          {relatorio.evolucao_acordos.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução dos Acordos</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={relatorio.evolucao_acordos}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="taxa_acordo_dia" stroke="#3B82F6" strokeWidth={2} name="Taxa de Acordo (%)" />
                    <Line type="monotone" dataKey="acordos_dia" stroke="#10B981" strokeWidth={2} name="Acordos por Dia" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabela de Agentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance de Negociação por Agente</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa de Acordo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total Acordos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Valor Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Desconto Médio
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Performance
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {relatorio.agentes.map((agent) => (
                    <tr key={agent.agent_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{agent.nome_agente}</div>
                        <div className="text-sm text-gray-500">{agent.agent_id}</div>
                        <div className="text-xs text-gray-400">{agent.total_ligacoes} ligações</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{agent.taxa_acordo}%</div>
                        <div className="text-xs text-gray-500">{agent.total_acordos}/{agent.total_ligacoes}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.total_acordos}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agent.valor_total_acordos)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(agent.valor_medio_acordo)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.desconto_medio.toFixed(1)}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPerformanceColor(agent.performance)}`}>
                          {agent.performance}
                        </span>
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
  );
};

export default RelatorioAcordosPage;
