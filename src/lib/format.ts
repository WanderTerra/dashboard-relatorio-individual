// Mapeamento de nomes técnicos para nomes amigáveis
export const itemNameMap: Record<string, string> = {
  // Itens de avaliação
  "fraseologia_explica_motivo": "Explicação do Motivo",
  "seguranca_info_corretas": "Confirmações de Segurança",
  "cordialidade_respeito": "Cordialidade e Respeito",
  "empatia_genuina": "Empatia com Cliente",
  "escuta_sem_interromper": "Escuta Ativa",
  "clareza_direta": "Clareza na Comunicação", 
  "comunicacao_tom_adequado": "Tom de Voz Adequado",
  "oferta_valores_corretos": "Apresentação de Valores",
  "confirmacao_aceite": "Confirmação de Aceitação",
  
  // Outros critérios
  "saudacao_padrao": "Saudação Padrão", 
  "identificacao_completa": "Identificação Completa",
  "uso_script_padrao": "Uso de Script",
  "finalizacao_adequada": "Finalização Adequada",
  "solucao_duvidas": "Esclarecimento de Dúvidas",
  "tempo_medio_atendimento": "Tempo de Atendimento",
  "gestao_objecoes": "Gestão de Objeções",
  "captura_dados": "Captura de Dados",
  "conhecimento_produto": "Conhecimento do Produto",
  "persuasao_efetiva": "Persuasão Efetiva",
  
  // Status
  "CONFORME": "Conforme",
  "NAO CONFORME": "Não Conforme",
  "NAO SE APLICA": "Não Aplicável",
  
  // Fallback para casos não mapeados
  "": ""
};

// Função que formata um nome técnico para exibição amigável
export function formatItemName(technicalName: any): string {
  // Verificar se technicalName existe e é uma string
  if (!technicalName || typeof technicalName !== 'string') {
    return "";
  }
  
  // Se existir no mapa, retorna o valor mapeado
  if (itemNameMap[technicalName]) {
    return itemNameMap[technicalName];
  }
  
  // Se não existir no mapa, formata o nome substituindo underscores por espaços
  // e capitalizando cada palavra
  return technicalName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Função para formatar o nome do agente
export function formatAgentName(agent: any): string {
  if (!agent) return "Agente sem nome";
  
  // Verificar se o ID do agente está no mapeamento de correção
  const agentId = agent.agent_id?.toString();
  if (agentId && agentIdNameMap[agentId]) {
    return agentIdNameMap[agentId];
  }
  
  // Verificar se existe nome no formato esperado (pode estar em 'nome' ou 'name')
  if (agent.nome) return agent.nome;
  if (agent.name) return agent.name;
  
  // Se o nome não existe em nenhum formato conhecido, retorna um valor padrão com o ID
  return agentId ? `Agente ${agentId}` : "Agente sem nome";
}

// Mapeamento de IDs de agentes para nomes corretos
export const agentIdNameMap: Record<string, string> = {
  "1011": "Adryan Araujo",
  "1112": "Anny Danielli",
  "1099": "Arthur Marques",
  "1103": "Cayo Eduardo",
  "1146": "Davy de Lucena",
  "1006": "Eduarda Nogueira",
  "1143": "Elias Balcazar",
  "1016": "Elizabeth Souza",
  "1029": "Ewerton Lino",
  "1148": "Gabriel Arguelho",
  "1155": "Gabriela Poquiviqui",
  "1151": "Gabriele Vitoria",
  "1113": "Gabrielly Silva",
  "1034": "Hilda Fraide",
  "1129": "Iasmin Oshiro",
  "1104": "Isabely Sena",
  "1144": "Jennifer Dayane",
  "1094": "Juliany Vargas",
  "1063": "Julliany Tenorio",
  "1116": "Kali Vitória",
  "1134": "Karla Teixeira",
  "1132": "Kezia Fernandes",
  "1149": "Leticia Cardoso",
  "1105": "Lucas Rodrigues",
  "1070": "Marcos Dos Santos",
  "1073": "Maria Costa",
  "1024": "Maria Eduarda Polak",
  "1152": "Mateus Machado",
  "1119": "Mileida Gomes",
  "1069": "Milene Luchese",
  "1064": "Murilo Freitas",
  "1009": "Nathaly Cruz",
  "1156": "Nathaly Cruz",
  "1118": "Octávio de Almeida",
  "1115": "Pablo Henrique",
  "1111": "Patrick Espindola",
  "1153": "Pedro Henrique",
  "1145": "Pedro Sales",
  "1150": "Sara Esselin",
  "1106": "Victor Antunes",
  "1126": "Wesley Gomes",
  "1030": "Yasmim Souza",
  "1088": "Yasmim Souza (Pequenas Carteiras)"
};
