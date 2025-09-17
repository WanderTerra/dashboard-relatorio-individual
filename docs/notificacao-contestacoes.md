# Sistema de Notificações para Contestações

## Visão Geral

Este documento descreve a implementação do sistema de notificações para contestações de feedbacks, seguindo o modelo das notificações existentes no sistema.

## Funcionalidades Implementadas

### 1. Componente ContestacaoNotificationBell

**Arquivo:** `src/components/ContestacaoNotificationBell.tsx`

- **Ícone:** AlertTriangle (triângulo de alerta) em cor laranja
- **Comportamento:** Pisca quando há contestações pendentes
- **Contador:** Mostra o número de contestações pendentes (máximo 9+)
- **Atualização:** Refetch automático a cada 30 segundos

### 2. Funcionalidades do Dropdown

- **Lista de contestações:** Mostra todas as contestações pendentes
- **Informações exibidas:**
  - Nome do agente
  - Critério contestado
  - Comentário da contestação
  - Data/hora da contestação

### 3. Ações Rápidas

- **Aceitar:** Aceita a contestação rapidamente
- **Rejeitar:** Rejeita a contestação rapidamente
- **Ver Detalhes:** Navega para a página de feedbacks com o modal aberto

### 4. Integração com Modal Existente

- **Navegação:** Ao clicar em "Ver Detalhes", navega para `/feedback?contestacao={id}`
- **Abertura automática:** A página de feedbacks detecta o parâmetro e abre o modal automaticamente
- **Modal completo:** Permite análise detalhada e decisão final

## Permissões

O componente só é exibido para usuários com permissões de:
- `admin`
- `monitor`

## Localização

O componente está integrado no Header (`src/components/Header.tsx`) e aparece ao lado do status "Online".

## API Utilizada

- **Endpoint:** `/api/feedback/contestacoes/pendentes`
- **Função:** `getContestacoesPendentes()` em `src/lib/api.ts`
- **Tipo:** `ContestacaoOut[]`

## Estados e Comportamentos

### Estados Visuais
- **Normal:** Ícone cinza com hover
- **Com pendências:** Ícone laranja piscando por 5 segundos
- **Contador:** Badge laranja com número de pendências

### Interações
- **Click no sino:** Abre/fecha dropdown
- **Click em contestação:** Navega para página de feedbacks
- **Ações rápidas:** Executam mutações imediatas
- **Click fora:** Fecha dropdown

## Fluxo de Uso

1. **Monitor recebe notificação** visual (sino piscando)
2. **Clica no sino** para ver contestações pendentes
3. **Pode decidir rapidamente** (aceitar/rejeitar) ou
4. **Clicar em "Ver Detalhes"** para análise completa
5. **Modal se abre automaticamente** na página de feedbacks
6. **Monitor analisa** e toma decisão final

## Benefícios

- **Visibilidade imediata** de contestações pendentes
- **Ações rápidas** para decisões simples
- **Integração perfeita** com sistema existente
- **Experiência consistente** com notificações atuais
- **Acesso direto** ao modal de análise detalhada

## Manutenção

- **Atualização automática** via React Query
- **Sincronização** entre estado local e API
- **Tratamento de erros** robusto
- **Logs detalhados** para debugging
