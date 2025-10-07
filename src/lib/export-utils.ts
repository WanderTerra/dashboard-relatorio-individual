import { RelatorioProdutividade, RelatorioNotas, RelatorioAcordos } from './api';

export const exportToCSV = (data: any[], filename: string) => {
  if (!data || data.length === 0) {
    alert('Não há dados para exportar');
    return;
  }

  // Obter as chaves do primeiro objeto como cabeçalhos
  const headers = Object.keys(data[0]);
  
  // Criar linha de cabeçalho
  const csvHeaders = headers.join(',');
  
  // Criar linhas de dados
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Escapar aspas duplas e envolver em aspas se contém vírgula ou quebra de linha
      if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    }).join(',');
  });
  
  // Combinar cabeçalho e dados
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  // Criar e baixar arquivo
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportRelatorioProdutividade = (relatorio: RelatorioProdutividade) => {
  const data = relatorio.agentes.map(agent => ({
    'ID do Agente': agent.agent_id,
    'Nome do Agente': agent.nome_agente,
    'Total de Ligações': agent.total_ligacoes,
    'Ligações Hoje': agent.ligacoes_hoje,
    'Ligações Esta Semana': agent.ligacoes_semana,
    'Ligações Este Mês': agent.ligacoes_mes,
    'Primeira Ligação': agent.primeira_ligacao ? new Date(agent.primeira_ligacao).toLocaleDateString('pt-BR') : 'N/A',
    'Última Ligação': agent.ultima_ligacao ? new Date(agent.ultima_ligacao).toLocaleDateString('pt-BR') : 'N/A'
  }));

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `relatorio_produtividade${periodo}`);
};

export const exportRelatorioNotas = (relatorio: RelatorioNotas) => {
  const data = relatorio.agentes.map(agent => ({
    'ID do Agente': agent.agent_id,
    'Nome do Agente': agent.nome_agente,
    'Total de Ligações': agent.total_ligacoes,
    'Média de Pontuação': agent.media_pontuacao,
    'Menor Pontuação': agent.menor_pontuacao,
    'Maior Pontuação': agent.maior_pontuacao,
    'Aprovações': agent.aprovacoes,
    'Reprovações': agent.reprovacoes,
    'Taxa de Aprovação (%)': agent.taxa_aprovacao,
    'Status': agent.status
  }));

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `relatorio_notas${periodo}`);
};

export const exportRelatorioAcordos = (relatorio: RelatorioAcordos) => {
  const data = relatorio.agentes.map(agent => ({
    'ID do Agente': agent.agent_id,
    'Nome do Agente': agent.nome_agente,
    'Total de Ligações': agent.total_ligacoes,
    'Total de Acordos': agent.total_acordos,
    'Total de Não Acordos': agent.total_nao_acordos,
    'Taxa de Acordo (%)': agent.taxa_acordo,
    'Valor Total Acordos (R$)': agent.valor_total_acordos.toFixed(2),
    'Valor Médio Acordo (R$)': agent.valor_medio_acordo.toFixed(2),
    'Desconto Médio (%)': agent.desconto_medio.toFixed(1),
    'Performance': agent.performance
  }));

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `relatorio_acordos${periodo}`);
};

export const exportResumoProdutividade = (relatorio: RelatorioProdutividade) => {
  const data = [
    {
      'Métrica': 'Total de Ligações',
      'Valor': relatorio.resumo.total_ligacoes,
      'Unidade': 'ligações'
    },
    {
      'Métrica': 'Total de Agentes',
      'Valor': relatorio.resumo.total_agentes,
      'Unidade': 'agentes'
    },
    {
      'Métrica': 'Média por Agente',
      'Valor': relatorio.resumo.media_ligacoes_agente,
      'Unidade': 'ligações/agente'
    },
    {
      'Métrica': 'Período',
      'Valor': relatorio.periodo.inicio && relatorio.periodo.fim 
        ? `${relatorio.periodo.inicio} a ${relatorio.periodo.fim}` 
        : 'Período completo',
      'Unidade': ''
    }
  ];

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `resumo_produtividade${periodo}`);
};

export const exportResumoNotas = (relatorio: RelatorioNotas) => {
  const data = [
    {
      'Métrica': 'Total de Agentes',
      'Valor': relatorio.resumo.total_agentes,
      'Unidade': 'agentes'
    },
    {
      'Métrica': 'Média Geral',
      'Valor': relatorio.resumo.media_geral,
      'Unidade': 'pontos'
    },
    {
      'Métrica': 'Taxa de Aprovação Geral',
      'Valor': relatorio.resumo.taxa_aprovacao_geral,
      'Unidade': '%'
    },
    {
      'Métrica': 'Período',
      'Valor': relatorio.periodo.inicio && relatorio.periodo.fim 
        ? `${relatorio.periodo.inicio} a ${relatorio.periodo.fim}` 
        : 'Período completo',
      'Unidade': ''
    }
  ];

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `resumo_notas${periodo}`);
};

export const exportResumoAcordos = (relatorio: RelatorioAcordos) => {
  const data = [
    {
      'Métrica': 'Total de Agentes',
      'Valor': relatorio.resumo.total_agentes,
      'Unidade': 'agentes'
    },
    {
      'Métrica': 'Total de Acordos',
      'Valor': relatorio.resumo.total_acordos,
      'Unidade': 'acordos'
    },
    {
      'Métrica': 'Taxa de Acordo Geral',
      'Valor': relatorio.resumo.taxa_acordo_geral,
      'Unidade': '%'
    },
    {
      'Métrica': 'Valor Total Acordos',
      'Valor': relatorio.resumo.valor_total_acordos.toFixed(2),
      'Unidade': 'R$'
    },
    {
      'Métrica': 'Período',
      'Valor': relatorio.periodo.inicio && relatorio.periodo.fim 
        ? `${relatorio.periodo.inicio} a ${relatorio.periodo.fim}` 
        : 'Período completo',
      'Unidade': ''
    }
  ];

  const periodo = relatorio.periodo.inicio && relatorio.periodo.fim 
    ? `_${relatorio.periodo.inicio}_${relatorio.periodo.fim}` 
    : '_completo';
  
  exportToCSV(data, `resumo_acordos${periodo}`);
};
