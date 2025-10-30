// Script de debug para verificar o problema do botão "Ver Feedback"
// Execute no console do navegador na página de feedbacks

console.log('🔍 DEBUG - Botão Ver Feedback');

// Função para testar a navegação manualmente
function testarNavegacaoFeedback() {
  console.log('1️⃣ Testando navegação para feedback específico...');
  
  // Simular dados de uma contestação
  const contestacaoTeste = {
    agent_id: '1111', // Substitua pelo ID do agente real
    avaliacao_id: '123', // Substitua pelo ID da avaliação real
    feedback_id: '456' // Substitua pelo ID do feedback real
  };
  
  console.log('📋 Dados da contestação:', contestacaoTeste);
  
  // Verificar se os elementos existem
  console.log('2️⃣ Verificando elementos no DOM...');
  
  // Verificar se o agente está expandido
  const agentElement = document.querySelector(`[data-agent-id="${contestacaoTeste.agent_id}"]`);
  console.log('👤 Elemento do agente:', agentElement);
  
  // Verificar se a avaliação está expandida
  const avaliacaoElement = document.querySelector(`[data-avaliacao-id="${contestacaoTeste.avaliacao_id}"]`);
  console.log('📊 Elemento da avaliação:', avaliacaoElement);
  
  // Verificar se o feedback existe
  const feedbackElement = document.getElementById(`feedback-${contestacaoTeste.feedback_id}`);
  console.log('💬 Elemento do feedback:', feedbackElement);
  
  if (feedbackElement) {
    console.log('✅ Feedback encontrado! Fazendo scroll...');
    feedbackElement.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'center' 
    });
    
    // Destacar o feedback
    feedbackElement.classList.add('ring-4', 'ring-orange-400', 'ring-opacity-75');
    setTimeout(() => {
      feedbackElement.classList.remove('ring-4', 'ring-orange-400', 'ring-opacity-75');
    }, 3000);
    
    console.log('🎯 Scroll e destaque aplicados!');
  } else {
    console.log('❌ Feedback não encontrado! Verifique se:');
    console.log('   - O ID do feedback está correto');
    console.log('   - O agente está expandido');
    console.log('   - A avaliação está expandida');
    console.log('   - O feedback está renderizado no DOM');
  }
}

// Função para listar todos os feedbacks disponíveis
function listarFeedbacksDisponiveis() {
  console.log('3️⃣ Listando todos os feedbacks disponíveis...');
  
  const feedbackElements = document.querySelectorAll('[id^="feedback-"]');
  console.log(`📋 Total de feedbacks encontrados: ${feedbackElements.length}`);
  
  feedbackElements.forEach((element, index) => {
    const id = element.id;
    const feedbackId = id.replace('feedback-', '');
    console.log(`   ${index + 1}. ID: ${feedbackId}, Elemento:`, element);
  });
}

// Função para verificar o estado dos acordeões
function verificarEstadoAcordeoes() {
  console.log('4️⃣ Verificando estado dos acordeões...');
  
  // Verificar agentes expandidos
  const agentesExpandidos = document.querySelectorAll('[data-state="open"]');
  console.log('👥 Agentes expandidos:', agentesExpandidos.length);
  
  agentesExpandidos.forEach((element, index) => {
    console.log(`   ${index + 1}. Agente:`, element);
  });
  
  // Verificar avaliações expandidas
  const avaliacoesExpandidas = document.querySelectorAll('[data-state="open"]');
  console.log('📊 Avaliações expandidas:', avaliacoesExpandidas.length);
}

// Executar todas as verificações
console.log('🚀 Iniciando debug completo...');
testarNavegacaoFeedback();
listarFeedbacksDisponiveis();
verificarEstadoAcordeoes();

console.log('💡 DICAS:');
console.log('1. Verifique se o ID do feedback na contestação está correto');
console.log('2. Certifique-se de que o agente e avaliação estão expandidos');
console.log('3. Verifique se o feedback está renderizado no DOM');
console.log('4. Teste com dados reais de uma contestação existente');



