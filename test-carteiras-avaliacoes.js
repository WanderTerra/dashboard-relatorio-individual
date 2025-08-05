// Script para testar o endpoint de carteiras da tabela avaliacoes
async function testCarteirasAvaliacoes() {
  try {
    console.log('🔍 Testando endpoint /carteiras-avaliacoes...');
    
    const response = await fetch('http://localhost:8000/carteiras-avaliacoes', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 Status:', response.status);
    console.log('📋 Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Carteiras encontradas:', data);
      console.log('📈 Total de carteiras:', data.length);
      
      if (data.length > 0) {
        console.log('🎯 Primeira carteira:', data[0]);
        console.log('📝 Formato esperado:', {
          value: 'string',
          label: 'string'
        });
      }
    } else {
      const error = await response.text();
      console.log('❌ Erro:', error);
    }
  } catch (error) {
    console.error('💥 Erro na requisição:', error);
  }
}

// Executar o teste
testCarteirasAvaliacoes(); 