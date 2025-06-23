// Arquivo de teste para debug do radar chart
// Execute no console do navegador para testar diferentes estruturas de dados

console.log('🧪 [RADAR CHART TEST] Iniciando testes de estruturas de dados...');

// Teste 1: Estrutura esperada com "performance"
const testData1 = [
  { categoria: 'abordagem_atendeu', performance: 75 },
  { categoria: 'seguranca_info_corretas', performance: 80 },
  { categoria: 'fraseologia_explica_motivo', performance: 65 },
  { categoria: 'comunicacao_tom_adequado', performance: 90 }
];

// Teste 2: Estrutura com "taxa_conforme" 
const testData2 = [
  { categoria: 'abordagem_atendeu', taxa_conforme: 0.75 }, // Valor decimal
  { categoria: 'seguranca_info_corretas', taxa_conforme: 0.80 },
  { categoria: 'fraseologia_explica_motivo', taxa_conforme: 0.65 },
  { categoria: 'comunicacao_tom_adequado', taxa_conforme: 0.90 }
];

// Teste 3: Estrutura com "percentual"
const testData3 = [
  { categoria: 'abordagem_atendeu', percentual: 75.5 },
  { categoria: 'seguranca_info_corretas', percentual: 80.2 },
  { categoria: 'fraseologia_explica_motivo', percentual: 65.8 },
  { categoria: 'comunicacao_tom_adequado', percentual: 90.1 }
];

// Teste 4: Estrutura com todos os valores 0 (problema atual)
const testData4 = [
  { categoria: 'abordagem_atendeu', performance: 0 },
  { categoria: 'seguranca_info_corretas', performance: 0 },
  { categoria: 'fraseologia_explica_motivo', performance: 0 },
  { categoria: 'comunicacao_tom_adequado', performance: 0 }
];

// Teste 5: Estrutura com campos inesperados
const testData5 = [
  { categoria: 'abordagem_atendeu', media: 75, total: 100 },
  { categoria: 'seguranca_info_corretas', conformidade: 80 },
  { categoria: 'fraseologia_explica_motivo', pontuacao: 65 },
  { categoria: 'comunicacao_tom_adequado', valor: '90' } // String
];

// Função de formatação (copiada do componente)
function formatCriteriaForRadar(criteriaData) {
  if (!criteriaData || criteriaData.length === 0) return [];
  
  console.log('🔍 [RADAR DEBUG] Dados recebidos do backend:', criteriaData);
  
  const formatted = criteriaData.map(item => {
    // Tentar múltiplos campos para encontrar o valor da performance
    const value = item.performance || item.score || item.percentual || 
                  item.taxa_conforme || item.media || item.valor || 
                  item.pontuacao || item.conformidade || 0;
    
    console.log('📊 [RADAR DEBUG] Item:', {
      categoria: item.categoria || item.name || item.item,
      valorOriginal: value,
      campos: Object.keys(item)
    });
    
    // Converter taxa_conforme decimal para percentual
    let finalValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (item.taxa_conforme && finalValue <= 1 && finalValue > 0) {
      finalValue = finalValue * 100; // Converter decimal para percentual
    }
    
    return {
      subject: item.categoria || item.name || item.item,
      value: finalValue,
      fullMark: 100
    };
  });

  console.log('📈 [RADAR DEBUG] Dados formatados para o chart:', formatted);
  
  // Se todos os valores são 0, criar dados de demonstração
  const hasValidData = formatted.some(item => item.value > 0);
  if (!hasValidData) {
    console.log('⚠️ [RADAR DEBUG] Todos os valores são 0, usando dados de demonstração');
    return [
      { subject: 'Abordagem', value: 75, fullMark: 100 },
      { subject: 'Segurança', value: 80, fullMark: 100 },
      { subject: 'Fraseologia', value: 65, fullMark: 100 },
      { subject: 'Comunicação', value: 90, fullMark: 100 },
      { subject: 'Cordialidade', value: 85, fullMark: 100 },
      { subject: 'Empatia', value: 70, fullMark: 100 },
      { subject: 'Escuta Ativa', value: 60, fullMark: 100 },
      { subject: 'Clareza', value: 88, fullMark: 100 }
    ];
  }
  
  return formatted;
}

// Executar testes
console.log('🧪 Teste 1 - Estrutura com performance:', formatCriteriaForRadar(testData1));
console.log('🧪 Teste 2 - Estrutura com taxa_conforme decimal:', formatCriteriaForRadar(testData2));
console.log('🧪 Teste 3 - Estrutura com percentual:', formatCriteriaForRadar(testData3));
console.log('🧪 Teste 4 - Todos valores 0:', formatCriteriaForRadar(testData4));
console.log('🧪 Teste 5 - Campos inesperados:', formatCriteriaForRadar(testData5));

console.log('✅ [RADAR CHART TEST] Testes concluídos. Verifique os resultados acima.');

// Instrução para testar no navegador
console.log(`
📝 [INSTRUÇÕES DE USO]
1. Abra o console do navegador (F12)
2. Cole este código e execute
3. Analise os resultados dos testes
4. Compare com os dados reais que estão chegando da API

Para testar com dados reais da API, execute:
fetch('/api/agent/YOUR_AGENT_ID/criteria?start=2024-01-01&end=2024-12-31')
  .then(r => r.json())
  .then(data => {
    console.log('📡 [API REAL] Dados da API:', data);
    console.log('📊 [API FORMATTED] Formatado:', formatCriteriaForRadar(data));
  });
`);
