// Script para testar o endpoint de carteiras
async function testCarteiras() {
  try {
    const response = await fetch('http://localhost:8000/api/carteiras/', {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer test-token',
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Status:', response.status);
    console.log('Headers:', response.headers);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Carteiras:', data);
    } else {
      const error = await response.text();
      console.log('Erro:', error);
    }
  } catch (error) {
    console.error('Erro na requisição:', error);
  }
}

// Executar o teste
testCarteiras(); 