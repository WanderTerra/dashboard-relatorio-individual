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
export function formatItemName(technicalName: string): string {
  if (!technicalName) return "";
  
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
