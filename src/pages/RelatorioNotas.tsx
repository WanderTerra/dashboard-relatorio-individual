import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRelatorioNotas, type RelatorioNotas, getCarteirasFromAvaliacoes } from '../lib/api';
import { useFilters } from '../hooks/use-filters';
import { exportRelatorioNotas, exportResumoNotas } from '../lib/export-utils';
import { Calendar, Download, TrendingUp, Users, Target, AlertTriangle, CheckCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const RelatorioNotasPage: React.FC = () => {
  const { filters, setFilters } = useFilters();
  const [isLoading, setIsLoading] = useState(false);

  const { data: relatorio, error, refetch } = useQuery({
    queryKey: ['relatorio-notas', filters],
    queryFn: () => getRelatorioNotas(filters),
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
    exportRelatorioNotas(relatorio);
  };

  const handleExportResumo = () => {
    if (!relatorio) {
      alert('Nenhum dado disponível para exportar');
      return;
    }
    exportResumoNotas(relatorio);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('pt-BR');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
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
          <h1 className="text-2xl font-bold text-gray-900">Relatório de Notas dos Agentes</h1>
          <p className="text-gray-600 mt-1">
            Análise de performance e notas dos agentes
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
                  <Target className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Média Geral</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.media_geral}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <CheckCircle className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
                  <p className="text-2xl font-bold text-gray-900">{relatorio.resumo.taxa_aprovacao_geral}%</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
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

          {/* Melhores Agentes */}
          {relatorio.resumo.melhores_agentes.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">🏆 Melhores Agentes</h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {relatorio.resumo.melhores_agentes.map((agent, index) => (
                  <div key={agent.agent_id} className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="text-2xl font-bold text-green-600">#{index + 1}</div>
                    <div className="font-medium text-gray-900">{agent.nome_agente}</div>
                    <div className="text-sm text-green-600 font-semibold">{agent.media_pontuacao} pts</div>
                    <div className="text-xs text-gray-500">{agent.total_ligacoes} ligações</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Agentes que Precisam de Atenção */}
          {relatorio.resumo.agentes_atencao.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-red-500" />
                Agentes que Precisam de Atenção
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {relatorio.resumo.agentes_atencao.map((agent, index) => (
                  <div key={agent.agent_id} className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="text-2xl font-bold text-red-600">#{index + 1}</div>
                    <div className="font-medium text-gray-900">{agent.nome_agente}</div>
                    <div className="text-sm text-red-600 font-semibold">{agent.media_pontuacao} pts</div>
                    <div className="text-xs text-gray-500">{agent.total_ligacoes} ligações</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Gráfico de Evolução */}
          {relatorio.evolucao_notas.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Evolução das Notas</h2>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={relatorio.evolucao_notas}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="data" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="media_dia" stroke="#3B82F6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Tabela de Agentes */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Performance por Agente</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Agente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Média
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Menor/Maior
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Aprovações
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Taxa Aprovação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-bold text-gray-900">{agent.media_pontuacao}</div>
                        <div className="text-xs text-gray-500">{agent.total_ligacoes} ligações</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.menor_pontuacao} - {agent.maior_pontuacao}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="text-green-600 font-medium">{agent.aprovacoes}</div>
                        <div className="text-red-600 text-xs">{agent.reprovacoes} reprovações</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.taxa_aprovacao}%
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(agent.status)}`}>
                          {agent.status}
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

export default RelatorioNotasPage;
