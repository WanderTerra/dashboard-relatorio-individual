# Implementação das APIs para Matriz P.O.R.T.E.S

## APIs Necessárias

### 1. `/api/avaliacoes/portes`
**Método:** GET  
**Parâmetros:** `start`, `end`, `carteira`  
**Resposta:**
```json
{
  "estrategias": [
    {
      "descricao": "Manutenção de boas práticas identificadas",
      "prioridade": "alta",
      "impacto": "positivo"
    }
  ]
}
```

### 2. `/api/criterios/notas`
**Método:** GET  
**Parâmetros:** `start`, `end`, `carteira`  
**Resposta:**
```json
{
  "notas_100": [
    {
      "nome": "Argumentação eficaz",
      "quantidade": 15,
      "percentual": 25.5
    }
  ],
  "notas_baixas": [
    {
      "nome": "Tempo de resposta",
      "quantidade": 8,
      "percentual": 13.6
    }
  ]
}
```

### 3. `/api/agentes/evolucao`
**Método:** GET  
**Parâmetros:** `start`, `end`, `carteira`  
**Resposta:**
```json
{
  "evolucao": [
    {
      "nome": "João Silva",
      "ultimas_notas": [45, 42, 38],
      "tendencia": "declinante"
    }
  ],
  "top_agentes": [
    {
      "nome": "Maria Santos",
      "media": 92.5,
      "tendencia": "crescente"
    }
  ],
  "pontos_atencao": [
    {
      "descricao": "Baixa adesão ao script",
      "agentes_afetados": 5,
      "prioridade": "alta"
    }
  ]
}
```

## Implementação no Backend

### 1. Criar endpoints no backend
```javascript
// Exemplo para Express.js
app.get('/api/avaliacoes/portes', async (req, res) => {
  const { start, end, carteira } = req.query;
  // Implementar lógica de análise
});

app.get('/api/criterios/notas', async (req, res) => {
  const { start, end, carteira } = req.query;
  // Implementar análise de critérios
});

app.get('/api/agentes/evolucao', async (req, res) => {
  const { start, end, carteira } = req.query;
  // Implementar análise de evolução
});
```

### 2. Lógica de Análise
- **Critérios com nota 100**: Buscar avaliações com pontuação máxima
- **Critérios baixos**: Identificar critérios com média < 50
- **Evolução de agentes**: Analisar tendência das últimas 3 avaliações
- **Top agentes**: Ordenar por média de performance
- **Pontos de atenção**: Identificar padrões de baixa performance

### 3. Filtros por Carteira
- Quando `carteira` estiver presente, filtrar dados específicos
- Quando não estiver, retornar dados gerais de todas as carteiras

## Status Atual
- ✅ Frontend implementado com dados simulados
- ❌ APIs do backend não implementadas
- ⏳ Funcionando com fallback para dados existentes

## Próximos Passos
1. Implementar as 3 APIs no backend
2. Descomentar as queries no frontend
3. Testar com dados reais
4. Ajustar lógica de análise conforme necessário 