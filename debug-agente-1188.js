// Script de debug para verificar o problema do agente 1188
// Execute no console do navegador na página do agente 1188

console.log('🔍 DEBUG - Agente 1188 - Verificação de Gamificação');

// 1. Verificar dados de gamificação da API
fetch('/api/gamification/agent/1188')
  .then(res => res.json())
  .then(data => {
    console.log('📊 Dados de Gamificação da API:', data);
  })
  .catch(err => {
    console.error('❌ Erro na API de gamificação:', err);
  });

// 2. Verificar conquistas do backend
fetch('/api/achievements/agent/1188')
  .then(res => res.json())
  .then(data => {
    console.log('🏆 Conquistas do Backend:', data);
    
    // Calcular XP total das conquistas
    const totalXpFromAchievements = data.reduce((sum, achievement) => {
      return sum + (achievement.xp_reward || 0);
    }, 0);
    
    console.log('💰 XP Total das Conquistas:', totalXpFromAchievements);
  })
  .catch(err => {
    console.error('❌ Erro na API de conquistas:', err);
  });

// 3. Verificar dados do agente (ligações, critérios, etc.)
Promise.all([
  fetch('/api/agents/1188/summary').then(res => res.json()),
  fetch('/api/agents/1188/calls').then(res => res.json()),
  fetch('/api/agents/1188/criteria').then(res => res.json())
]).then(([summary, calls, criteria]) => {
  console.log('📈 Resumo do Agente:', summary);
  console.log('📞 Ligações:', calls.length);
  console.log('📋 Critérios:', criteria.length);
  
  // Calcular XP baseado nas ligações
  const xpFromCalls = calls.reduce((sum, call) => {
    if (call.pontuacao >= 90) return sum + 20;
    if (call.pontuacao >= 70) return sum + 10;
    return sum + 5;
  }, 0);
  
  console.log('💰 XP Calculado das Ligações:', xpFromCalls);
}).catch(err => {
  console.error('❌ Erro ao buscar dados do agente:', err);
});

// 4. Verificar se há problemas de sincronização
console.log('🔄 Verificando sincronização...');
console.log('Se as conquistas existem mas o XP não está sendo contabilizado,');
console.log('pode ser um problema de sincronização entre frontend e backend.');

