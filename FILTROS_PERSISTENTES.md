# Dashboard - Filtros Persistentes

## Como Rodar o Dashboard

### 1. Instalar Dependências
```bash
npm install
```

### 2. Executar o Projeto
```bash
npm run dev
```

O dashboard estará disponível em: `http://localhost:5173` (ou porta similar se 5173 estiver ocupada)

### 3. Build para Produção
```bash
npm run build
```

## Funcionalidade de Filtros Persistentes

### O que foi implementado:

✅ **Filtros de Data Persistentes**
- Período padrão: últimos 6 meses
- Quando o usuário altera as datas, elas são salvas no localStorage
- As datas selecionadas são mantidas durante toda a navegação
- Persistem mesmo após fechar e reabrir o browser

✅ **Filtro de Carteira Persistente**
- Opções disponíveis: AGUAS, VUON
- Seleção é mantida durante a navegação
- Salvo no localStorage

### Onde funciona:
- ✅ **Dashboard Principal** (`/`) - Filtros de data e carteira
- ✅ **Detalhes do Agente** (`/agent/:id`) - Filtros de data
- ✅ **Itens da Ligação** (`/call/:avaliacaoId/items`) - Usa os filtros globais

### Como funciona:

#### Hook useFilters
Criado um hook customizado em `src/hooks/use-filters.ts` que:

- **Carrega filtros salvos** do localStorage na inicialização
- **Fallback inteligente**: Se não há dados salvos, usa período padrão (6 meses)
- **Salva automaticamente** qualquer alteração no localStorage
- **Fornece funções helper** para atualizar campos individuais

#### Persistência no localStorage
```javascript
// Chaves usadas
localStorage.setItem('dashboard_start_date', '2024-12-20')
localStorage.setItem('dashboard_end_date', '2025-06-20')  
localStorage.setItem('dashboard_carteira', 'AGUAS')
```

#### Cache Inteligente das Queries
- React Query usa os filtros como parte da chave do cache
- Mudança nos filtros dispara automaticamente novas consultas
- Cache é compartilhado entre componentes que usam os mesmos filtros

### Exemplo de Uso:

```tsx
import { useFilters } from '../hooks/use-filters';

const MeuComponente = () => {
  const { filters, setStartDate, setEndDate, setCarteira } = useFilters();
  
  // filters.start, filters.end, filters.carteira
  // são automaticamente persistidos
  
  return (
    <input 
      type="date" 
      value={filters.start}
      onChange={e => setStartDate(e.target.value)}
    />
  );
};
```

### Benefícios:

1. **UX Melhorada**: Usuário não perde seleções ao navegar
2. **Consistência**: Mesmos filtros em todas as páginas
3. **Performance**: Cache inteligente evita requests desnecessários  
4. **Manutenibilidade**: Estado centralizado e tipado
5. **Robustez**: Fallbacks para casos de erro no localStorage

### Componentes Atualizados:

- `src/pages/Dashboard.tsx` - Filtros principais
- `src/pages/AgentDetail.tsx` - Filtros de data
- `src/pages/CallItems.tsx` - Usa filtros globais
- `src/lib/api.ts` - Remove tipo duplicado Filters
- `src/hooks/use-filters.ts` - **NOVO** Hook de filtros

### Funções Helper Disponíveis:

```tsx
const {
  filters,           // Estado atual dos filtros
  setFilters,        // Atualizar múltiplos filtros
  setStartDate,      // Atualizar só data início
  setEndDate,        // Atualizar só data fim  
  setCarteira,       // Atualizar só carteira
  resetFilters,      // Voltar aos padrões
  clearStoredFilters // Limpar localStorage (debug)
} = useFilters();
```

## Testes

Para testar a funcionalidade:

1. **Acesse o dashboard** - deve carregar com período padrão (6 meses)
2. **Altere as datas** - selecione um período diferente
3. **Navegue para um agente** - as datas devem estar mantidas
4. **Feche e reabra o browser** - filtros devem persistir
5. **Teste o filtro de carteira** - seleção deve ser mantida na navegação

A implementação está completa e funcionando! 🎉
