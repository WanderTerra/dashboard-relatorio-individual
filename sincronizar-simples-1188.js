// Script SIMPLES para sincronizar agente 1188
// Execute no console do navegador na página do agente 1188

console.log('🔄 SINCRONIZAÇÃO SIMPLES - Agente 1188');

async function sincronizarSimples() {
  try {
    console.log('1️⃣ Verificando conquistas...');
    const achievementsResponse = await fetch('/api/achievements/agent/1188');
    const achievements = await achievementsResponse.json();
    console.log('🏆 Conquistas:', achievements);

    const totalXp = achievements.reduce((sum, achievement) => {
      return sum + (achievement.xp_reward || 0);
    }, 0);
    console.log('💰 XP Total das Conquistas:', totalXp);

    console.log('2️⃣ Verificando gamificação atual...');
    const gamificationResponse = await fetch('/api/gamification/agent/1188');
    const gamificationData = await gamificationResponse.json();
    console.log('📊 Gamificação atual:', gamificationData);

    if (gamificationData.current_xp < totalXp) {
      console.log('❌ PROBLEMA: XP do backend menor que o esperado');
      console.log('🔄 Tentando forçar sincronização...');
      
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
        
        // Aguardar e verificar
        setTimeout(async () => {
          const newGamificationResponse = await fetch('/api/gamification/agent/1188');
          const newGamificationData = await newGamificationResponse.json();
          console.log('📊 Nova gamificação:', newGamificationData);
          
          if (newGamificationData.current_xp > gamificationData.current_xp) {
            console.log('🎉 SUCESSO! XP foi atualizado!');
            console.log('🔄 Recarregue a página para ver a barra de progresso atualizada');
          } else {
            console.log('⚠️ XP ainda não foi atualizado. Pode ser necessário atualizar manualmente no backend.');
          }
        }, 3000);
        
      } else {
        console.error('❌ Erro na sincronização:', syncResponse.status, syncResponse.statusText);
      }
    } else {
      console.log('✅ XP já está correto');
    }

  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

// Executar
sincronizarSimples();



