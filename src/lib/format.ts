// Mapeamento de nomes técnicos para nomes amigáveis
export const itemNameMap: Record<string, string> = {
  // Itens de avaliação - variações principais
  "fraseologia_explica_motivo": "Explicação do Motivo",
  "explicacao_motivo": "Explicação do Motivo",
  "explicacao_do_motivo": "Explicação do Motivo",
  "seguranca_info_corretas": "Confirmações de Segurança",
  "confirmacoes_seguranca": "Confirmações de Segurança",
  "confirmacao_seguranca": "Confirmação de Segurança",
  "cordialidade_respeito": "Cordialidade e Respeito",
  "cordialidade_e_respeito": "Cordialidade e Respeito",
  "empatia_genuina": "Empatia com Cliente",
  "empatia_com_cliente": "Empatia com Cliente",
  "empatia_cliente": "Empatia com Cliente",
  "escuta_sem_interromper": "Escuta Ativa",
  "escuta_ativa": "Escuta Ativa",
  "clareza_direta": "Clareza na Comunicação",
  "clareza_comunicacao": "Clareza na Comunicação",
  "clareza_na_comunicacao": "Clareza na Comunicação",
  "comunicacao_tom_adequado": "Tom de Voz Adequado",
  "tom_de_voz_adequado": "Tom de Voz Adequado",
  "tom_voz_adequado": "Tom de Voz Adequado",
  "oferta_valores_corretos": "Apresentação de Valores",
  "apresentacao_de_valores": "Apresentação de Valores",
  "apresentacao_valores": "Apresentação de Valores",
  "confirmacao_aceite": "Confirmação de Aceitação",
  "confirmacao_aceitacao": "Confirmação de Aceitação",
  "confirmacao_de_aceitacao": "Confirmação de Aceitação",
  
  // Critérios adicionais
  "abordagem_atendeu": "Abordagem Atendeu",
  "encerramento_agradece": "Encerramento Agradece",
  "reforco_prazo": "Reforço Prazo",
  
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
export function formatItemName(technicalName: string): string {
  if (!technicalName) return "";
  
  // Normalizar o nome técnico (lowercase, remover espaços extras)
  const normalizedName = technicalName.toLowerCase().trim();
  
  // Se existir no mapa, retorna o valor mapeado
  if (itemNameMap[normalizedName]) {
    return itemNameMap[normalizedName];
  }
  
  // Se não existir no mapa, formata o nome substituindo underscores por espaços
  // e capitalizando cada palavra
  return technicalName
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Função para padronizar a estrutura de critérios
export function standardizeCriteria(criterion: any): {
  id: string;
  name: string;
  normalizedName: string;
  value: number;
  isNotApplicable: boolean;
  rawData: any;
} {
  // Tentar múltiplos campos para encontrar o nome do critério
  const rawName = criterion.categoria || criterion.name || criterion.item || criterion.nome || '';
  const normalizedName = normalizeCriteriaName(rawName);
  
  // Tentar múltiplos campos para encontrar o valor
  const rawValue = criterion.pct_conforme || criterion.performance || criterion.score || criterion.percentual || 
                  criterion.taxa_conforme || criterion.media || criterion.valor || 
                  criterion.pontuacao || criterion.conformidade || 0;
  
  // Converter para número e lidar com valores decimais
  let value = typeof rawValue === 'number' ? rawValue : parseFloat(rawValue) || 0;
  
  // Se o valor parece ser decimal (entre 0 e 1), converter para percentual
  if (value > 0 && value <= 1) {
    value = value * 100;
  }
  
  // Verificar se é um critério "Não se aplica"
  const isNotApplicable = value === 0 || value < 1;
  
  // Gerar ID único baseado no nome normalizado
  const id = `criterion_${normalizedName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  return {
    id,
    name: rawName,
    normalizedName,
    value,
    isNotApplicable,
    rawData: criterion
  };
}

// Função para analisar critérios e identificar potenciais duplicatas
export function analyzeCriteriaDuplicates(criteria: any[]): {
  total: number;
  unique: number;
  duplicates: number;
  duplicateGroups: Array<{
    normalizedName: string;
    items: Array<{ originalName: string; index: number; criterion: any }>;
  }>;
} {
  if (!criteria || criteria.length === 0) {
    return { total: 0, unique: 0, duplicates: 0, duplicateGroups: [] };
  }
  
  const nameGroups = new Map<string, Array<{ originalName: string; index: number; criterion: any }>>();
  
  criteria.forEach((criterion, index) => {
    const rawName = criterion.categoria || criterion.name || criterion.item || criterion.nome || '';
    const normalizedName = normalizeCriteriaName(rawName);
    
    if (!normalizedName) return;
    
    if (!nameGroups.has(normalizedName)) {
      nameGroups.set(normalizedName, []);
    }
    
    nameGroups.get(normalizedName)!.push({
      originalName: rawName,
      index,
      criterion
    });
  });
  
  const duplicateGroups = Array.from(nameGroups.entries())
    .filter(([_, items]) => items.length > 1)
    .map(([normalizedName, items]) => ({
      normalizedName,
      items
    }));
  
  const total = criteria.length;
  const unique = nameGroups.size;
  const duplicates = total - unique;
  
  return {
    total,
    unique,
    duplicates,
    duplicateGroups
  };
}

// Função para deduplicar critérios baseado no nome normalizado
export function deduplicateCriteria(criteria: any[]): any[] {
  if (!criteria || criteria.length === 0) return [];
  
  // Primeiro, analisar os dados para identificar duplicatas
  const analysis = analyzeCriteriaDuplicates(criteria);
  
  if (analysis.duplicates > 0) {
    console.group(`🔍 Análise de Duplicatas - ${analysis.total} critérios`);
    console.log(`📊 Total: ${analysis.total}, Únicos: ${analysis.unique}, Duplicatas: ${analysis.duplicates}`);
    
    analysis.duplicateGroups.forEach(group => {
      console.group(`🔄 Grupo de duplicatas: "${group.normalizedName}"`);
      group.items.forEach(item => {
        console.log(`  - "${item.originalName}" (índice ${item.index})`);
      });
      console.groupEnd();
    });
    console.groupEnd();
  }
  
  const seen = new Map<string, any>();
  const deduplicated: any[] = [];
  
  criteria.forEach((criterion, index) => {
    // Tentar múltiplos campos para encontrar o nome do critério
    const rawName = criterion.categoria || criterion.name || criterion.item || criterion.nome || '';
    const normalizedName = normalizeCriteriaName(rawName);
    
    // Se o nome estiver vazio, pular
    if (!normalizedName) {
      console.warn(`Critério sem nome válido encontrado (índice ${index}):`, criterion);
      return;
    }
    
    // Se já vimos este critério, pular
    if (seen.has(normalizedName)) {
      const existing = seen.get(normalizedName);
      console.warn(`Critério duplicado removido: "${rawName}" (índice ${index}) - mantido: "${existing.originalName}" (índice ${existing.index})`);
      return;
    }
    
    // Marcar como visto e adicionar à lista deduplicada
    seen.set(normalizedName, { 
      criterion, 
      originalName: rawName,
      index 
    });
    
    // Adicionar o critério com informações de deduplicação
    deduplicated.push({
      ...criterion,
      _deduplicationInfo: {
        originalIndex: index,
        normalizedName,
        isDuplicate: false,
        duplicateCount: analysis.duplicateGroups.find(g => g.normalizedName === normalizedName)?.items.length || 1
      }
    });
  });
  
  console.log(`✅ Deduplicação concluída: ${criteria.length} → ${deduplicated.length} critérios únicos`);
  
  // Log detalhado dos critérios removidos
  if (criteria.length !== deduplicated.length) {
    const removedCount = criteria.length - deduplicated.length;
    console.log(`⚠️ ${removedCount} critérios duplicados foram removidos automaticamente`);
  }
  
  return deduplicated;
}

// Função para normalizar o nome de um critério para comparação
export function normalizeCriteriaName(name: string): string {
  if (!name) return "";
  
  return name
    .toLowerCase()
    .trim()
    .replace(/[_\s]+/g, '_') // Normalizar espaços e underscores
    .replace(/[^a-z0-9_]/g, '') // Remover caracteres especiais
    .replace(/^(criterio|criterios|item|itens)_/i, '') // Remover prefixos comuns
    .replace(/_(criterio|criterios|item|itens)$/i, ''); // Remover sufixos comuns
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

// Função para categorizar critérios baseado no nome
export const categorizeCriteria = (criteriaName: string): string => {
  const lowerName = criteriaName.toLowerCase();
  
  // Abordagem
  if (lowerName.includes("abordagem") || lowerName.includes("script") || lowerName.includes("cumpriment") || 
      lowerName.includes("identificou") || lowerName.includes("origem do atendimento") ||
      lowerName.includes("saudacao") || lowerName.includes("identificacao") || lowerName.includes("uso_script")) {
    return "Abordagem";
  }
  
  // Confirmação de dados
  if (lowerName.includes("confirmacao") || lowerName.includes("confirmacao") || lowerName.includes("dados") ||
      lowerName.includes("valores") || lowerName.includes("informou") || lowerName.includes("seguranca_info") ||
      lowerName.includes("confirmacoes_seguranca") || lowerName.includes("confirmacao_seguranca")) {
    return "Confirmação de dados";
  }
  
  // Check-list
  if (lowerName.includes("check") || lowerName.includes("confirm") || lowerName.includes("verific") ||
      lowerName.includes("boleto") || lowerName.includes("vencimento") || lowerName.includes("aceite") ||
      lowerName.includes("captura_dados") || lowerName.includes("conhecimento_produto")) {
    return "Check-list";
  }
  
  // Negociação
  if (lowerName.includes("negociacao") || lowerName.includes("negociação") || lowerName.includes("oferta") || 
      lowerName.includes("desconto") || lowerName.includes("parcelamento") || lowerName.includes("fechamento") ||
      lowerName.includes("acordo") || lowerName.includes("pagamento") || lowerName.includes("gestao_objecoes") ||
      lowerName.includes("persuasao_efetiva") || lowerName.includes("reforco_prazo")) {
    return "Negociação";
  }
  
  // Falha Crítica
  if (lowerName.includes("falha") || lowerName.includes("critica") || lowerName.includes("crítica") ||
      lowerName.includes("problema") || lowerName.includes("erro") || lowerName.includes("falha_critica")) {
    return "Falha Crítica";
  }
  
  // Encerramento
  if (lowerName.includes("encerramento") || lowerName.includes("agradece") || lowerName.includes("duvida") ||
      lowerName.includes("questionou") || lowerName.includes("ajudar") || lowerName.includes("finalizacao") ||
      lowerName.includes("solucao_duvidas") || lowerName.includes("tempo_medio_atendimento")) {
    return "Encerramento";
  }
  
  // Se não conseguir categorizar, usar "Outros"
  return "Outros";
};

// Função para organizar itens por categoria
export const organizeItemsByCategory = (items: any[]) => {
  const categories = {
    "Abordagem": [],
    "Confirmação de dados": [],
    "Check-list": [],
    "Negociação": [],
    "Falha Crítica": [],
    "Encerramento": [],
    "Outros": []
  };
  
  items.forEach(item => {
    const category = categorizeCriteria(item.categoria);
    if (categories[category as keyof typeof categories]) {
      categories[category as keyof typeof categories].push(item);
    }
  });
  
  // Remover categorias vazias e retornar apenas as que têm itens
  return Object.entries(categories)
    .filter(([_, items]) => items.length > 0)
    .map(([categoryName, categoryItems]) => ({
      category: categoryName,
      items: categoryItems
    }));
};

// Função para organizar itens baseado na estrutura da carteira
export const organizeItemsByCarteiraStructure = (items: any[], carteiraStructure: any) => {
  if (!carteiraStructure || !carteiraStructure.categories) {
    // Fallback para organização padrão se não houver estrutura
    return organizeItemsByCategory(items);
  }

  // Criar um mapa dos itens por categoria
  const itemsByCategory = items.reduce((acc, item) => {
    const category = item.categoria || 'Outros';
    if (!acc[category]) acc[category] = [];
    acc[category].push(item);
    return acc;
  }, {});

  // Organizar baseado na estrutura da carteira
  const organizedCategories = carteiraStructure.categories
    .filter(category => itemsByCategory[category.name]?.length > 0)
    .map(category => ({
      category: category.name,
      items: itemsByCategory[category.name] || [],
      order: category.order || 0
    }))
    .sort((a, b) => a.order - b.order);

  return organizedCategories;
};
