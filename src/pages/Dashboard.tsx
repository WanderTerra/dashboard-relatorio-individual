import * as React from 'react';
import { useQuery, useQueries } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, TrendingUp, Users, Award, Activity, Circle, CircleOff, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';

import KpiCards from '../components/KpiCards';
import TrendLineChart from '../components/TrendLineChart';
import PageHeader from '../components/PageHeader';
import { Combobox } from '../components/ui/select-simple';
import { getKpis, getTrend, getAgents, getAgentWorstItem, getAllUsers } from '../lib/api';
import { formatItemName, formatAgentName } from '../lib/format';
import { useFilters } from '../hooks/use-filters';

// Lista de carteiras disponíveis - pode ser expandida no futuro
const carteiras = [
  { value: 'AGUAS', label: 'AGUAS' },
  { value: 'VUON', label: 'VUON' },
];

const Dashboard: React.FC = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();
  const [searchAgent, setSearchAgent] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = React.useState(1);
  const [agentsPerPage] = React.useState(15);

  // Construir objeto de filtros para a API (incluindo carteira apenas se tiver valor)
  const apiFilters = { 
    start: filters.start, 
    end: filters.end, 
    ...(filters.carteira ? { carteira: filters.carteira } : {}) 
  };

  // Debug dos filtros
  console.log('🔍 FILTROS ENVIADOS PARA API:', apiFilters);
  console.log('📅 DATAS:', { start: filters.start, end: filters.end, carteira: filters.carteira });

  // KPIs e tendência (dados de performance - COM filtros)
  const { data: kpis }   = useQuery({ queryKey: ['kpis',   apiFilters], queryFn: () => getKpis(apiFilters) });
  const { data: trend }  = useQuery({ queryKey: ['trend',  apiFilters], queryFn: () => getTrend(apiFilters) });
  const { data: agents } = useQuery({ queryKey: ['agents', apiFilters], queryFn: () => getAgents(apiFilters) });
  
  // Buscar todos os usuários (status ativo/inativo - SEM filtros)
  const { data: allUsers, isFetching: isFetchingUsers, refetch: refetchUsers } = useQuery({ 
    queryKey: ['all-users'], 
    queryFn: () => getAllUsers(),
    staleTime: 1 * 60_000, // 1 minuto
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  // Para cada agente, dispara uma query para obter o pior item
  const worstItemQueries = useQueries({
    queries: agents?.map((agent: any) => ({
      queryKey: ['agent-worst-item', agent.agent_id, apiFilters],
      queryFn: () => getAgentWorstItem(agent.agent_id, apiFilters),
      enabled: !!agents,
      staleTime: 5 * 60_000,
    })) ?? [],
  });

  // Combinar dados de performance com status ativo/inativo
  // IMPORTANTE: 
  // - 'agents' = dados de performance (ligações, média) - COM filtros de data
  // - 'allUsers' = status ativo/inativo dos usuários - SEM filtros
  // Wesley pode estar ativo em 'allUsers' mas não ter dados em 'agents'
  const agentsWithStatus = React.useMemo(() => {
    if (!agents || !allUsers) return [];
    
    console.log('🔍 DEBUG MAPPING - INÍCIO:');
    console.log('Agents (performance):', agents);
    console.log('All Users (status):', allUsers);
    
    return agents.map((agent: any) => {
      // Encontrar o usuário correspondente na lista de usuários
      // Tentar diferentes formas de mapeamento
      let userInfo = allUsers.find((user: any) => {
        // Comparação mais robusta por ID
        const agentId = agent.agent_id?.toString();
        const userId = user.id?.toString();
        return agentId && userId && agentId === userId;
      });
      
      // Se não encontrar, tentar por username
      if (!userInfo) {
        userInfo = allUsers.find((user: any) => {
          const agentName = agent.nome?.toLowerCase().trim();
          const userName = user.username?.toLowerCase().trim();
          return agentName && userName && agentName === userName;
        });
      }
      
      // Se ainda não encontrar, tentar por nome completo
      if (!userInfo) {
        userInfo = allUsers.find((user: any) => {
          const agentName = agent.nome?.toLowerCase().trim();
          const userFullName = user.full_name?.toLowerCase().trim();
          return agentName && userFullName && agentName === userFullName;
        });
      }
      
      // Validação mais robusta do status ativo
      let isActive = false;
      if (userInfo) {
        // Se encontrou o usuário, verificar o campo active
        // No banco: 0 = inativo, 1 = ativo
        if (userInfo.active === 1 || userInfo.active === true) {
          isActive = true;
        } else if (userInfo.active === 0 || userInfo.active === false) {
          isActive = false;
        } else {
          // Se active não é 0/1/true/false, assumir inativo
          isActive = false;
          console.warn(`⚠️ Campo 'active' inválido para usuário ${userInfo.id}:`, userInfo.active);
        }
      } else {
        // Se não encontrou o usuário, assumir inativo
        isActive = false;
        console.warn(`⚠️ Usuário não encontrado para agente ${agent.agent_id} (${agent.nome})`);
      }
      
      // Log detalhado para debug
      console.log(`🔍 Agent ${agent.agent_id} (${agent.nome}):`, {
        agent_id: agent.agent_id,
        agent_nome: agent.nome,
        user_found: !!userInfo,
        user_id: userInfo?.id,
        user_username: userInfo?.username,
        user_full_name: userInfo?.full_name,
        user_active_raw: userInfo?.active,
        user_active_type: typeof userInfo?.active,
        final_isActive: isActive,
        status_dashboard: isActive ? 'Ativo' : 'Inativo',
        mapping_strategy: userInfo ? 'Encontrado' : 'Não encontrado'
      });
      
      return {
        ...agent,
        isActive
      };
    });
  }, [agents, allUsers]);

  // Função de debug para investigar problemas de mapeamento
  const debugMapping = React.useCallback(() => {
    console.log('🔍 DEBUG COMPLETO - INICIANDO INVESTIGAÇÃO');
    
    if (!agents || !allUsers) {
      console.log('❌ Dados não disponíveis:', { agents: !!agents, allUsers: !!allUsers });
      return;
    }
    
    console.log('📊 DADOS BRUTOS:');
    console.log('Agentes (performance):', agents);
    console.log('Usuários (status):', allUsers);
    
    // Verificar Wesley especificamente
    const wesleyAgent = agents.find((a: any) => a.nome?.toLowerCase().includes('wesley'));
    const wesleyUser = allUsers.find((u: any) => 
      u.username === 'wesley.gomes' || 
      u.full_name?.toLowerCase().includes('wesley')
    );
    
    console.log('🔍 WESLEY - DADOS ESPECÍFICOS:');
    console.log('Como agente:', wesleyAgent);
    console.log('Como usuário:', wesleyUser);
    
    // Verificar se Wesley tem dados de performance
    if (wesleyAgent) {
      console.log('✅ WESLEY ENCONTRADO COMO AGENTE:', {
        agent_id: wesleyAgent.agent_id,
        nome: wesleyAgent.nome,
        ligacoes: wesleyAgent.ligacoes,
        media: wesleyAgent.media,
        tem_dados: wesleyAgent.ligacoes > 0 || wesleyAgent.media > 0
      });
    } else {
      console.log('❌ WESLEY NÃO ENCONTRADO COMO AGENTE');
    }
    
    // Verificar se Wesley tem dados como usuário
    if (wesleyUser) {
      console.log('✅ WESLEY ENCONTRADO COMO USUÁRIO:', {
        id: wesleyUser.id,
        username: wesleyUser.username,
        full_name: wesleyUser.full_name,
        active: wesleyUser.active,
        active_type: typeof wesleyUser.active
      });
    } else {
      console.log('❌ WESLEY NÃO ENCONTRADO COMO USUÁRIO');
    }
    
    // Tentar diferentes estratégias de mapeamento
    if (wesleyAgent && wesleyUser) {
      console.log('🔍 WESLEY - TESTE DE MAPEAMENTO:');
      
      // Teste 1: Por ID
      const matchById = wesleyAgent.agent_id?.toString() === wesleyUser.id?.toString();
      console.log('Match por ID:', matchById, {
        agent_id: wesleyAgent.agent_id,
        user_id: wesleyUser.id
      });
      
      // Teste 2: Por username
      const matchByUsername = wesleyAgent.nome?.toLowerCase() === wesleyUser.username?.toLowerCase();
      console.log('Match por username:', matchByUsername, {
        agent_nome: wesleyAgent.nome,
        user_username: wesleyUser.username
      });
      
      // Teste 3: Por nome completo
      const matchByFullName = wesleyAgent.nome?.toLowerCase() === wesleyUser.full_name?.toLowerCase();
      console.log('Match por nome completo:', matchByFullName, {
        agent_nome: wesleyAgent.nome,
        user_full_name: wesleyUser.full_name
      });
      
      // Teste 4: Verificar campo active
      console.log('Campo active do usuário:', {
        value: wesleyUser.active,
        type: typeof wesleyUser.active,
        should_be_active: wesleyUser.active === 1 || wesleyUser.active === true
      });
    }
    
    // Verificar todos os usuários ativos
    const activeUsers = allUsers.filter((u: any) => u.active === 1 || u.active === true);
    console.log('👥 USUÁRIOS ATIVOS:', activeUsers.map((u: any) => ({
      id: u.id,
      username: u.username,
      full_name: u.full_name,
      active: u.active
    })));
    
    // Verificar se agentes correspondentes existem
    const activeUsersWithAgents = activeUsers.map((user: any) => {
      const agent = agents.find((a: any) => 
        a.agent_id?.toString() === user.id?.toString() ||
        a.nome?.toLowerCase() === user.username?.toLowerCase() ||
        a.nome?.toLowerCase() === user.full_name?.toLowerCase()
      );
      return {
        user,
        agent,
        hasAgent: !!agent,
        tem_dados: agent ? (agent.ligacoes > 0 || agent.media > 0) : false
      };
    });
    
    console.log('🔗 USUÁRIOS ATIVOS COM AGENTES:', activeUsersWithAgents);
    
    // Verificar especificamente Wesley
    const wesleyMapping = activeUsersWithAgents.find((item: any) => 
      item.user.username === 'wesley.gomes' || 
      item.user.full_name?.toLowerCase().includes('wesley')
    );
    
    if (wesleyMapping) {
      console.log('🎯 WESLEY - MAPEAMENTO FINAL:', wesleyMapping);
    }
  }, [agents, allUsers]);

  // Função para verificar diretamente a API de agentes
  const checkAgentsAPI = React.useCallback(async () => {
    console.log('🔍 VERIFICANDO API DE AGENTES DIRETAMENTE...');
    
    try {
      const response = await fetch('/api/agents', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const agentsData = await response.json();
        console.log('📊 DADOS DA API DE AGENTES:', agentsData);
        
        // Procurar por Wesley nos dados da API
        const wesleyInAPI = agentsData.find((agent: any) => 
          agent.nome?.toLowerCase().includes('wesley') ||
          agent.agent_id?.toString() === '20'
        );
        
        if (wesleyInAPI) {
          console.log('✅ WESLEY ENCONTRADO NA API:', wesleyInAPI);
        } else {
          console.log('❌ WESLEY NÃO ENCONTRADO NA API');
        }
        
        // Verificar todos os agentes com dados
        const agentsWithData = agentsData.filter((agent: any) => 
          agent.ligacoes > 0 || agent.media > 0
        );
        
        console.log('📈 AGENTES COM DADOS:', agentsWithData.length);
        console.log('📊 TOTAL DE AGENTES NA API:', agentsData.length);
        
      } else {
        console.error('❌ Erro ao buscar agentes:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Erro na verificação da API:', error);
    }
  }, []);

  // Calcular o item com maior não conformidade geral
  const maiorNaoConformidade = React.useMemo(() => {
    if (!worstItemQueries || worstItemQueries.length === 0) return null;
    
    // Coletar todos os piores itens dos agentes
    const pioresItens = worstItemQueries
      .filter(query => query.data && !query.isLoading && !query.isError)
      .map(query => query.data)
      .filter(data => data && typeof data === 'object' && 'categoria' in data && 'taxa_nao_conforme' in data);
    
    if (pioresItens.length === 0) return null;
    
    // Agrupar por categoria e somar as taxas de não conformidade
    const categoriasMap = new Map();
    
    pioresItens.forEach((item: any) => {
      const categoria = item.categoria;
      const taxa = item.taxa_nao_conforme;
      
      if (categoriasMap.has(categoria)) {
        categoriasMap.set(categoria, categoriasMap.get(categoria) + taxa);
      } else {
        categoriasMap.set(categoria, taxa);
      }
    });
    
    // Encontrar a categoria com maior soma de não conformidade
    let maiorCategoria = null;
    let maiorTaxa = 0;
    
    categoriasMap.forEach((taxa, categoria) => {
      if (taxa > maiorTaxa) {
        maiorTaxa = taxa;
        maiorCategoria = categoria;
      }
    });
    
    return {
      categoria: maiorCategoria,
      taxa_nao_conforme: maiorTaxa / pioresItens.length // Média da taxa
    };
  }, [worstItemQueries]);

  // Debug: verificar dados dos KPIs
  React.useEffect(() => {
    if (kpis) {
      console.log('KPIs data:', kpis);
      console.log('Pior item (API):', kpis.pior_item);
    }
    if (maiorNaoConformidade) {
      console.log('Maior não conformidade (calculada):', maiorNaoConformidade);
    }
    if (allUsers) {
      console.log('All Users data:', allUsers);
      
      // Verificação específica para Wesley Gomes
      const wesleyUser = allUsers.find((user: any) => 
        user.username === 'wesley.gomes' || 
        user.full_name?.toLowerCase().includes('wesley')
      );
      if (wesleyUser) {
        console.log('🔍 WESLEY GOMES - Dados do usuário:', {
          id: wesleyUser.id,
          username: wesleyUser.username,
          full_name: wesleyUser.full_name,
          active_raw: wesleyUser.active,
          active_type: typeof wesleyUser.active,
          should_be_active: wesleyUser.active === 1 || wesleyUser.active === true
        });
      }
    }
    if (agentsWithStatus) {
      console.log('Agents with status:', agentsWithStatus);
      
      // Resumo dos agentes ativos/inativos
      const activeAgents = agentsWithStatus.filter((agent: any) => agent.isActive);
      const inactiveAgents = agentsWithStatus.filter((agent: any) => !agent.isActive);
      
      console.log('📊 RESUMO AGENTES:');
      console.log(`✅ Ativos: ${activeAgents.length}`);
      console.log(`❌ Inativos: ${inactiveAgents.length}`);
      console.log(`📋 Total: ${agentsWithStatus.length}`);
      
      if (inactiveAgents.length > 0) {
        console.log('❌ Agentes Inativos:', inactiveAgents.map((a: any) => `${a.agent_id} (${a.nome})`));
      }
      
      // Verificação específica para Wesley Gomes no dashboard
      const wesleyAgent = agentsWithStatus.find((agent: any) => 
        agent.nome?.toLowerCase().includes('wesley')
      );
      if (wesleyAgent) {
        console.log('🔍 WESLEY GOMES - Status no dashboard:', {
          agent_id: wesleyAgent.agent_id,
          nome: wesleyAgent.nome,
          isActive: wesleyAgent.isActive,
          status_display: wesleyAgent.isActive ? 'Ativo' : 'Inativo'
        });
      }
    }
  }, [kpis, maiorNaoConformidade, allUsers, agentsWithStatus]);

  // Ordenar agentes: primeiro por status ativo, depois por performance
  const sortedAgents = React.useMemo(() => {
    return [...agentsWithStatus].sort((a, b) => {
      // Primeiro: agentes ativos primeiro
      if (a.isActive && !b.isActive) return -1;
      if (!a.isActive && b.isActive) return 1;
      
      // Segundo: por quantidade de ligações
      if (a.ligacoes !== b.ligacoes) {
        return b.ligacoes - a.ligacoes;
      }
      
      // Terceiro: por média
      return b.media - a.media;
    });
  }, [agentsWithStatus]);

  // Filtrar agentes baseado na pesquisa e filtros
  const filteredAgents = sortedAgents.filter((agent: any) => {
    // Filtro por nome
    const nameMatch = formatAgentName(agent).toLowerCase().includes(searchAgent.toLowerCase());
    
    // Filtro por status
    const statusMatch = statusFilter === 'all' || 
      (statusFilter === 'active' && agent.isActive) || 
      (statusFilter === 'inactive' && !agent.isActive);
    
    return nameMatch && statusMatch;
  });

  // Lógica de paginação
  const totalPages = Math.ceil(filteredAgents.length / agentsPerPage);
  const startIndex = (currentPage - 1) * agentsPerPage;
  const endIndex = startIndex + agentsPerPage;
  const currentAgents = filteredAgents.slice(startIndex, endIndex);

  // Resetar página quando mudar filtros
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchAgent, statusFilter]);

  // Debug específico para Wesley
  const debugWesley = React.useCallback(() => {
    console.log('🔍 DEBUG ESPECÍFICO - WESLEY GOMES');
    
    if (!agents || !allUsers) {
      console.log('❌ Dados não disponíveis');
      return;
    }
    
    // Encontrar Wesley nos agentes
    const wesleyAgent = agents.find((a: any) => 
      a.nome?.toLowerCase().includes('wesley') ||
      a.nome === 'Wesley Gomes'
    );
    
    // Encontrar Wesley nos usuários
    const wesleyUser = allUsers.find((u: any) => 
      u.username === 'wesley.gomes' || 
      u.full_name === 'Wesley Gomes' ||
      u.full_name?.toLowerCase().includes('wesley')
    );
    
    console.log('🔍 WESLEY - DADOS ENCONTRADOS:');
    console.log('Como agente (performance):', wesleyAgent);
    console.log('Como usuário (status):', wesleyUser);
    
    console.log('📊 COMPARAÇÃO DAS TABELAS:');
    console.log('Tabela AGENTS (performance):', agents.length, 'registros');
    console.log('Tabela USERS (status):', allUsers.length, 'registros');
    
    // Verificar quantos usuários ativos não têm dados de performance
    const activeUsersWithoutPerformance = allUsers.filter((user: any) => {
      const isActive = user.active === 1 || user.active === true;
      if (!isActive) return false;
      
      const hasPerformance = agents.some((agent: any) => 
        agent.agent_id?.toString() === user.id?.toString() ||
        agent.nome?.toLowerCase() === user.username?.toLowerCase() ||
        agent.nome?.toLowerCase() === user.full_name?.toLowerCase()
      );
      
      return !hasPerformance;
    });
    
    console.log('👥 USUÁRIOS ATIVOS SEM PERFORMANCE:', activeUsersWithoutPerformance.length);
    activeUsersWithoutPerformance.forEach((user: any) => {
      console.log('  -', user.full_name, '(ID:', user.id, ')');
    });
    
    if (wesleyAgent && wesleyUser) {
      console.log('🎯 WESLEY - ANÁLISE DE MAPEAMENTO:');
      
      // Verificar se o mapeamento está funcionando
      const isMapped = agentsWithStatus.find((agent: any) => 
        agent.nome === 'Wesley Gomes'
      );
      
      console.log('Mapeamento atual:', isMapped);
      
      // Verificar campo active do usuário
      console.log('Status do usuário:', {
        active: wesleyUser.active,
        type: typeof wesleyUser.active,
        should_be_active: wesleyUser.active === 1 || wesleyUser.active === true
      });
      
      // Verificar se está sendo convertido corretamente
      const shouldBeActive = wesleyUser.active === 1 || wesleyUser.active === true;
      console.log('Deve ser ativo?', shouldBeActive);
      
      // Verificar todos os usuários para comparar
      console.log('📊 TODOS OS USUÁRIOS:');
      allUsers.forEach((user: any) => {
        if (user.full_name?.toLowerCase().includes('wesley') || user.username === 'wesley.gomes') {
          console.log('Wesley encontrado:', {
            id: user.id,
            username: user.username,
            full_name: user.full_name,
            active: user.active,
            type: typeof user.active
          });
        }
      });
    }
  }, [agents, allUsers, agentsWithStatus]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Dashboard
              </h1>
              <p className="text-gray-600 text-lg">
                Análise de performance e métricas dos agentes
              </p>
            </div>
            {isFetchingUsers && (
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                Atualizando dados...
              </div>
            )}
          </div>
          
          {/* Filtros */}
          <div className="flex flex-wrap gap-6 items-end">
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Data Início</label>
              <input
                type="date"
                value={filters.start}
                onChange={e => setStartDate(e.target.value)}
                className="h-11 border border-gray-300 rounded-xl px-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Data Fim</label>
              <input
                type="date"
                value={filters.end}
                onChange={e => setEndDate(e.target.value)}
                className="h-11 border border-gray-300 rounded-xl px-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white text-gray-900 placeholder-gray-500"
              />
            </div>
            <div className="min-w-[200px] flex flex-col">
              <label className="block text-sm font-semibold text-gray-800 mb-2">Carteira</label>
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

        <div className="space-y-8">
          {/* Cartões de KPI Modernizados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Pontuação Média</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.media_geral ? `${kpis.media_geral.toFixed(1)}%` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <TrendingUp className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${kpis?.media_geral || 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Total de Ligações</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {kpis?.total_ligacoes?.toLocaleString() || '0'}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Avaliadas no período</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Agentes Ativos</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {sortedAgents.filter((a: any) => a.isActive).length}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Participando da avaliação</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 hover:shadow-xl transition-all duration-300">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-600 mb-1">Maior não conformidade</p>
                  <p className="text-lg font-bold text-gray-900 leading-tight">
                    {maiorNaoConformidade ? `${formatItemName(maiorNaoConformidade.categoria)} (${(maiorNaoConformidade.taxa_nao_conforme * 100).toFixed(0)}%)` : '—'}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl flex-shrink-0 ml-4">
                  <Award className="w-6 h-6 text-red-600" />
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm text-gray-500">Necessita atenção</p>
              </div>
            </div>
          </div>

          {/* Gráfico de linha modernizado */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Tendência Temporal</h2>
                <p className="text-gray-600 mt-1">Evolução da performance ao longo do tempo</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl">
                <TrendingUp className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <TrendLineChart data={trend ?? []} />
          </div>

          {/* Erro na API */}
          {/* agentsIsError && ( // This line was removed as per the new_code, as the 'agents' query is now directly used. */}
          {/*   <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-6"> */}
          {/*     <div className="flex items-center"> */}
          {/*       <div className="flex-shrink-0"> */}
          {/*         <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center"> */}
          {/*           <div className="w-4 h-4 bg-red-600 rounded-full"></div> */}
          {/*         </div> */}
          {/*       </div> */}
          {/*       <div className="ml-3"> */}
          {/*         <h3 className="text-lg font-medium text-red-800"> */}
          {/*           Erro ao carregar dados dos agentes */}
          {/*         </h3> */}
          {/*         <div className="mt-2 text-sm text-red-700"> */}
          {/*           <p>Detalhes do erro: {agentsError?.message || 'Erro desconhecido'}</p> */}
          {/*           <p className="mt-1">Status: {(agentsError as any)?.response?.status} {(agentsError as any)?.response?.statusText}</p> */}
          {/*           <p className="mt-1">Filtros enviados: {JSON.stringify(apiFilters)}</p> */}
          {/*         </div> */}
          {/*         <div className="mt-4"> */}
          {/*           <button */}
          {/*             onClick={() => window.location.reload()} */}
          {/*             className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500" */}
          {/*           > */}
          {/*             Tentar novamente */}
          {/*           </button> */}
          {/*           <button */}
          {/*             onClick={() => { */}
          {/*               console.log('🧪 TESTE SEM FILTROS - Iniciando...'); */}
          {/*               fetch('/api/agents', { */}
          {/*                 headers: { */}
          {/*                   'Authorization': `Bearer ${localStorage.getItem('auth_token')}` */}
          {/*                 } */}
          {/*               }) */}
          {/*               .then(response => { */}
          {/*                 console.log('🧪 TESTE SEM FILTROS - Status:', response.status); */}
          {/*                 return response.text(); */}
          {/*               }) */}
          {/*               .then(data => { */}
          {/*                 console.log('🧪 TESTE SEM FILTROS - Dados:', data); */}
          {/*               }) */}
          {/*               .catch(error => { */}
          {/*                 console.error('🧪 TESTE SEM FILTROS - Erro:', error); */}
          {/*               }); */}
          {/*             }} */}
          {/*             className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500" */}
          {/*           > */}
          {/*             Testar sem filtros */}
          {/*           </button> */}
          {/*         </div> */}
          {/*       </div> */}
          {/*     </div> */}
          {/*   </div> */}
          {/* ) */}

          {/* Tabela de Agentes com pesquisa */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            <div className="px-8 py-8 border-b border-gray-200">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div>
                  <h2 className="text-3xl font-bold text-gray-900">Performance por Agente</h2>
                  <p className="text-lg text-gray-600 mt-2">
                    Análise detalhada de desempenho individual
                  </p>
                </div>
                
                {/* Campo de pesquisa e filtros */}
                <div className="flex flex-col sm:flex-row gap-4 min-w-[700px]">
                  {/* Campo de pesquisa */}
                  <div className="relative flex-1 min-w-[400px]">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-6 w-6 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      placeholder="Pesquisar agente..."
                      value={searchAgent}
                      onChange={(e) => setSearchAgent(e.target.value)}
                      className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-full leading-6 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 text-base"
                    />
                  </div>
                  
                  {/* Filtro de Status */}
                  <div className="min-w-[140px]">
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                      className="w-full h-12 border border-gray-300 rounded-lg px-4 text-sm shadow-sm focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all duration-200 bg-white text-gray-900"
                    >
                      <option value="all">Todos os Status</option>
                      <option value="active">Apenas Ativos</option>
                      <option value="inactive">Apenas Inativos</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <div className="w-full">
                <table className="w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Agente
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Ligações
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Média
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Não conformidade
                      </th>
                      <th className="px-4 py-5 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {currentAgents.map((agent: any, idx: number) => {
                      // Encontrar o índice correto no array original para buscar os dados de pior item
                      const originalIndex = filteredAgents.findIndex((a: any) => a.agent_id === agent.agent_id);
                      const wi = worstItemQueries[originalIndex];
                      let piorLabel = '—';
                      if (wi && wi.isLoading) piorLabel = '…';
                      else if (wi && wi.isError) piorLabel = 'Erro';
                      else if (wi && wi.data && typeof wi.data === 'object' && 'categoria' in wi.data && 'taxa_nao_conforme' in wi.data) {
                        const data = wi.data as { categoria: string; taxa_nao_conforme: number };
                        // Verificar se categoria é uma string válida antes de formatar
                        if (data.categoria && typeof data.categoria === 'string') {
                          piorLabel = `${formatItemName(data.categoria)} (${(data.taxa_nao_conforme * 100).toFixed(0)}%)`;
                        } else {
                          piorLabel = 'Dados inválidos';
                        }
                      }

                      return (
                        <tr key={agent.agent_id} className={`hover:bg-gray-50 transition-colors duration-200 ${
                          !agent.isActive ? 'opacity-60 bg-gray-50' : ''
                        }`}>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <div>
                                <div className="text-lg font-semibold text-gray-900">
                                  {formatAgentName(agent)}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-50 text-blue-700">
                              {agent.ligacoes}
                            </span>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className={`text-lg font-semibold ${
                                agent.media >= 70 ? 'text-green-600' : agent.media >= 50 ? 'text-yellow-600' : 'text-red-600'
                              }`}>
                                {agent.media.toFixed(1)}%
                              </span>
                              <div className="ml-3 w-16 bg-gray-200 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-500 ${
                                    agent.media >= 70 ? 'bg-green-500' : agent.media >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${agent.media}%` }}
                                ></div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <div className="flex items-center">
                              {agent.isActive ? (
                                <Circle className="w-4 h-4 text-green-500" />
                              ) : (
                                <CircleOff className="w-4 h-4 text-gray-400" />
                              )}
                              <span className={`ml-2 text-xs font-medium px-2 py-1 rounded-full ${
                                agent.isActive 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-gray-100 text-gray-600'
                              }`}>
                                {agent.isActive ? 'Ativo' : 'Inativo'}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap">
                            <span className="text-sm font-medium text-gray-900">
                              {piorLabel}
                            </span>
                          </td>
                          <td className="px-4 py-6 whitespace-nowrap text-left text-sm font-medium">
                            <Link
                              to={`/agent/${agent.agent_id}`}
                              className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-full transition-all duration-200 shadow-sm ${
                                agent.isActive
                                  ? 'text-white bg-blue-400 hover:bg-blue-500 focus:ring-2 focus:ring-offset-2 focus:ring-blue-300'
                                  : 'text-gray-500 bg-gray-200 cursor-not-allowed'
                              }`}
                            >
                              Detalhar
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {currentAgents.length === 0 && (
                <div className="text-center py-12">
                  <Search className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">Nenhum agente encontrado</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {searchAgent ? 'Tente ajustar os termos de pesquisa.' : 'Nenhum agente disponível no período selecionado.'}
                  </p>
                </div>
              )}
            </div>
            
            {/* Controles de Paginação */}
            {totalPages > 1 && (
              <div className="px-8 py-6 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Mostrando <span className="font-medium">{startIndex + 1}</span> a{' '}
                    <span className="font-medium">{Math.min(endIndex, filteredAgents.length)}</span> de{' '}
                    <span className="font-medium">{filteredAgents.length}</span> agentes
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {/* Botão Anterior */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </button>

                    {/* Números das páginas */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
                        // Mostrar apenas algumas páginas para não sobrecarregar
                        if (
                          page === 1 ||
                          page === totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={page}
                              onClick={() => setCurrentPage(page)}
                              className={`px-3 py-2 text-sm font-medium rounded-full transition-all duration-200 ${
                                page === currentPage
                                  ? 'bg-blue-600 text-white'
                                  : 'text-gray-500 bg-white border border-gray-300 hover:bg-gray-50'
                              }`}
                            >
                              {page}
                            </button>
                          );
                        } else if (
                          page === currentPage - 2 ||
                          page === currentPage + 2
                        ) {
                          return (
                            <span key={page} className="px-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Botão Próximo */}
                    <button
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-full hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      Próximo
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
