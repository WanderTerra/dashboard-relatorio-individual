// Script específico para debug do agente 1188
// Execute no console do navegador na página do agente 1188

console.log('🔍 DEBUG ESPECÍFICO - Agente 1188');

// Função para verificar se há problema de sincronização
async function debugAgent1188() {
  try {
    console.log('1️⃣ Verificando dados de gamificação...');
    const gamificationResponse = await fetch('/api/gamification/agent/1188');
    const gamificationData = await gamificationResponse.json();
    console.log('📊 Gamificação:', gamificationData);

    console.log('2️⃣ Verificando conquistas...');
    const achievementsResponse = await fetch('/api/achievements/agent/1188');
    const achievements = await achievementsResponse.json();
    console.log('🏆 Conquistas:', achievements);

    // Calcular XP total das conquistas
    const totalXpFromAchievements = achievements.reduce((sum, achievement) => {
      return sum + (achievement.xp_reward || 0);
    }, 0);
    console.log('💰 XP Total das Conquistas:', totalXpFromAchievements);

    console.log('3️⃣ Verificando dados do agente...');
    const [summaryRes, callsRes, criteriaRes] = await Promise.all([
      fetch('/api/agents/1188/summary'),
      fetch('/api/agents/1188/calls'),
      fetch('/api/agents/1188/criteria')
    ]);

    const summary = await summaryRes.json();
    const calls = await callsRes.json();
    const criteria = await criteriaRes.json();

    console.log('📈 Resumo:', summary);
    console.log('📞 Ligações:', calls.length);
    console.log('📋 Critérios:', criteria.length);

    // Calcular XP baseado nas ligações
    const xpFromCalls = calls.reduce((sum, call) => {
      if (call.pontuacao >= 90) return sum + 20;
      if (call.pontuacao >= 70) return sum + 10;
      return sum + 5;
    }, 0);
    console.log('💰 XP Calculado das Ligações:', xpFromCalls);

    console.log('4️⃣ Análise do problema...');
    console.log('XP do Backend (Gamificação):', gamificationData.current_xp);
    console.log('XP das Conquistas:', totalXpFromAchievements);
    console.log('XP das Ligações:', xpFromCalls);
    
    const expectedTotalXp = totalXpFromAchievements + xpFromCalls;
    console.log('XP Esperado Total:', expectedTotalXp);
    
    if (gamificationData.current_xp < expectedTotalXp) {
      console.log('❌ PROBLEMA IDENTIFICADO: XP do backend menor que o esperado');
      console.log('💡 SOLUÇÃO: Executar sincronização de conquistas');
      
      // Tentar forçar sincronização
      console.log('🔄 Tentando forçar sincronização...');
      try {
        const syncResponse = await fetch('/api/achievements/check/1188', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        const syncResult = await syncResponse.json();
        console.log('✅ Resultado da sincronização:', syncResult);
      } catch (syncError) {
        console.error('❌ Erro na sincronização:', syncError);
      }
    } else {
      console.log('✅ XP está correto');
    }

  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

// Executar o debug
debugAgent1188();

