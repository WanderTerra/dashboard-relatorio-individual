// Script para sincronizar a barra de progresso do agente 1188
// Execute no console do navegador na página do agente 1188

console.log('🔄 SINCRONIZAÇÃO FORÇADA - Agente 1188');

async function sincronizarAgente1188() {
  try {
    console.log('1️⃣ Verificando conquistas atuais...');
    const achievementsResponse = await fetch('/api/achievements/agent/1188');
    const achievements = await achievementsResponse.json();
    console.log('🏆 Conquistas encontradas:', achievements);

    // Calcular XP total das conquistas
    const totalXpFromAchievements = achievements.reduce((sum, achievement) => {
      return sum + (achievement.xp_reward || 0);
    }, 0);
    console.log('💰 XP Total das Conquistas:', totalXpFromAchievements);

    console.log('2️⃣ Verificando dados de gamificação atuais...');
    const gamificationResponse = await fetch('/api/gamification/agent/1188');
    const gamificationData = await gamificationResponse.json();
    console.log('📊 Gamificação atual:', gamificationData);

    console.log('3️⃣ Verificando ligações para calcular XP adicional...');
    let calls = [];
    let xpFromCalls = 0;
    
    try {
      const callsResponse = await fetch('/api/agents/1188/calls');
      if (callsResponse.ok) {
        calls = await callsResponse.json();
        console.log('📞 Ligações:', calls.length);

        // Calcular XP baseado nas ligações
        xpFromCalls = calls.reduce((sum, call) => {
          if (call.pontuacao >= 90) return sum + 20;
          if (call.pontuacao >= 70) return sum + 10;
          return sum + 5;
        }, 0);
        console.log('💰 XP das Ligações:', xpFromCalls);
      } else {
        console.log('⚠️ API de ligações não disponível (404), usando apenas XP das conquistas');
      }
    } catch (error) {
      console.log('⚠️ Erro ao buscar ligações:', error.message);
    }

    const expectedTotalXp = totalXpFromAchievements + xpFromCalls;
    console.log('💰 XP Esperado Total:', expectedTotalXp);
    console.log('📊 XP Atual no Backend:', gamificationData.current_xp);

    if (gamificationData.current_xp < expectedTotalXp) {
      console.log('❌ PROBLEMA CONFIRMADO: XP do backend menor que o esperado');
      
      console.log('4️⃣ Tentando forçar sincronização de conquistas...');
      try {
        const syncResponse = await fetch('/api/achievements/check/1188', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        
        if (syncResponse.ok) {
          const syncResult = await syncResponse.json();
          console.log('✅ Sincronização executada:', syncResult);
          
          // Aguardar um pouco e verificar se atualizou
          console.log('5️⃣ Aguardando atualização...');
          setTimeout(async () => {
            const newGamificationResponse = await fetch('/api/gamification/agent/1188');
            const newGamificationData = await newGamificationResponse.json();
            console.log('📊 Nova gamificação:', newGamificationData);
            
            if (newGamificationData.current_xp > gamificationData.current_xp) {
              console.log('🎉 SUCESSO! XP foi atualizado!');
              console.log('🔄 Recarregue a página para ver a barra de progresso atualizada');
            } else {
              console.log('⚠️ XP ainda não foi atualizado. Pode ser necessário aguardar mais tempo ou verificar o backend.');
            }
          }, 2000);
          
        } else {
          console.error('❌ Erro na sincronização:', syncResponse.status, syncResponse.statusText);
        }
      } catch (syncError) {
        console.error('❌ Erro ao executar sincronização:', syncError);
      }
    } else {
      console.log('✅ XP já está correto');
    }

  } catch (error) {
    console.error('❌ Erro na sincronização:', error);
  }
}

// Executar a sincronização
sincronizarAgente1188();
