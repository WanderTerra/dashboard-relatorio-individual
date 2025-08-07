# 📋 TO DO - IMPLEMENTAÇÃO DE AVALIAÇÃO AUTOMÁTICA DE ÁUDIO

## 🎯 **OBJETIVO**
Implementar sistema de avaliação automática de áudio transcrito e diarizado usando IA da OpenAI, seguindo critérios configurados nas carteiras. A avaliação será feita localmente (sem salvar no banco inicialmente) e permitirá edição manual posterior.

---

## 🏗️ **BACKEND - Estrutura de Dados**

### 1. **Modelos de Dados (Pydantic)**
- [ ] Criar `AvaliacaoCreate` e `AvaliacaoOut` models
- [ ] Criar `ItemAvaliadoCreate` e `ItemAvaliadoOut` models  
- [ ] Criar `AvaliacaoRequest` para receber dados da IA
- [ ] Criar `AvaliacaoResponse` para retornar resultados

### 2. **Tabelas do Banco de Dados**
- [X] Criar tabela `criterios` (id, nome, descricao, categoria, ativo) - **JÁ EXISTE**
- [X] Criar tabela `avaliacoes` (id, call_id, agent_id, data_ligacao, status_avaliacao, pontuacao, carteira, criado_em) - **JÁ EXISTE**
- [X] Criar tabela `itens_avaliados` (id, avaliacao_id, criterio_id, descricao, resultado, peso, observacao) - **JÁ EXISTE**
- [X] Atualizar `init_db.py` com as novas tabelas - **JÁ FEITO**
- [X] **NOTA**: Critérios são dinâmicos e podem ser adicionados sem prejuízo da avaliação

---

## 🤖 **BACKEND - Integração com IA**

### 3. **Serviço de Avaliação IA**
- [ ] Criar `AvaliacaoIAService` class
- [ ] Implementar método `avaliar_ligacao()` baseado na função fornecida
- [ ] Implementar método `redistribuir_pesos_e_pontuacao()` baseado na função fornecida
- [ ] Configurar modelo OpenAI: **gpt-4.1-mini**
- [ ] Implementar prompt engineering para OpenAI
- [ ] Implementar parsing da resposta da IA (JSON)
- [ ] Implementar tratamento de erros e fallback
- [ ] Implementar cálculo de pontuação (0-100)
- [ ] Implementar redistribuição de pesos para critérios "NÃO SE APLICA"

### 4. **Endpoint de Avaliação**
- [X] Criar `POST /avaliacao/automatica` endpoint
- [X] Receber: transcrição, carteira_id, call_id, agent_id
- [X] Buscar critérios da carteira
- [X] Chamar serviço de IA (simulado por enquanto)
- [X] **NÃO salvar no banco inicialmente** (apenas retornar resultado)
- [X] Retornar resultado da avaliação estruturado

### 5. **Endpoints de Consulta**
- [X] `GET /avaliacao/{avaliacao_id}` - Buscar avaliação específica (placeholder)
- [X] `GET /avaliacao/{avaliacao_id}/itens` - Buscar itens da avaliação (placeholder)
- [X] `PUT /avaliacao/{avaliacao_id}/item/{criterio_id}` - Editar item específico (pendente)
- [X] `GET /criterios/` - Listar todos os critérios
- [X] `GET /carteira/{carteira_id}/criterios` - Listar critérios da carteira

---

## 🎨 **FRONTEND - Interface de Avaliação**

### 6. **Novo Card na Página de Transcrição**
- [X] Adicionar novo card em `AudioUpload.tsx` para "Avaliação Automática"
- [X] Componente de seleção de carteira (usa mesma carteira do upload)
- [X] **Avaliação automática após transcrição** (sem botão manual)
- [X] Loading state durante processamento
- [X] Exibição dos resultados da avaliação
- [X] Botão para editar resultados manualmente

### 7. **Componente de Resultados**
- [X] Criar `AvaliacaoResultados.tsx` component
- [X] Exibir pontuação geral (0-100)
- [X] Exibir status (APROVADA/REPROVADA) - **limite: 70%**
- [X] Lista de critérios com resultados
- [X] Observações da IA para cada critério
- [X] Possibilidade de editar resultados manualmente
- [ ] Botão para salvar avaliação no banco (quando implementado)

### 8. **Integração com Páginas Existentes**
- [X] Atualizar `AudioUpload.tsx` para incluir card de avaliação automática
- [ ] Atualizar `CallItems.tsx` para mostrar resultados da IA
- [ ] Atualizar `Transcription.tsx` para incluir avaliação
- [ ] Adicionar navegação entre transcrição e avaliação

---

## 🔗 **FRONTEND - API Integration**

### 9. **Funções de API**
- [X] `avaliarTranscricaoAutomatica()` - Chamar avaliação IA
- [X] `getAvaliacaoById()` - Buscar avaliação (já existe)
- [X] `getItensAvaliacao()` - Buscar itens da avaliação
- [X] `updateItemAvaliacao()` - Atualizar item (já existe)
- [X] `getCriterios()` - Listar critérios
- [X] `getCriteriosCarteira()` - Listar critérios da carteira

### 10. **Hooks e Estados**
- [X] `useAvaliacaoAutomatica()` - Hook para gerenciar avaliação
- [X] `useCriterios()` - Hook para buscar critérios
- [X] Estados para loading, erro, sucesso
- [X] Cache de critérios por carteira

---

## 🎯 **Lógica de Negócio**

### 11. **Cálculo de Pontuação**
- [ ] Implementar lógica de redistribuição de pesos baseada na função fornecida
- [ ] Critérios "NÃO SE APLICA" = peso 0
- [ ] Critérios válidos = peso redistribuído igualmente
- [ ] Pontuação = (conformes / total_válidos) * 100
- [ ] **Status = APROVADA se >= 70, REPROVADA se < 70**

### 12. **Mapeamento de Resultados**
- [ ] `CONFORME` → "CONFORME"
- [ ] `NÃO CONFORME` → "NAO CONFORME"  
- [ ] `NÃO SE APLICA` → "NAO SE APLICA"
- [ ] Função `map_resultado_value()` (já existe no código fornecido)

### 13. **Tratamento de Falha Crítica**
- [ ] Implementar lógica especial para "Falha Crítica"
- [ ] Se "Falha Crítica" = "Não Conforme" → pontuação = 0%
- [ ] Caso contrário → cálculo normal

---

## 🔧 **Configuração e Deploy**

### 14. **Variáveis de Ambiente**
- [ ] `OPENAI_API_KEY` - Chave da API OpenAI
- [ ] `OPENAI_MODEL` - Modelo: **gpt-4.1-mini**
- [ ] `AVALIACAO_THRESHOLD` - Limite para aprovação: **70**

### 15. **Dependências**
- [ ] Adicionar `openai` no `requirements.txt`
- [ ] Configurar timeout adequado para chamadas da IA
- [ ] Implementar retry logic para falhas de API

---

## 📊 **Monitoramento e Logs**

### 16. **Logs e Debug**
- [ ] Logs detalhados do processo de avaliação
- [ ] Logs de prompts enviados para IA
- [ ] Logs de respostas recebidas
- [ ] Métricas de tempo de processamento
- [ ] Tratamento de erros da API OpenAI

---

## 🧪 **Testes e Validação**

### 17. **Testes**
- [ ] Testes unitários do serviço de IA
- [ ] Testes de integração dos endpoints
- [ ] Testes de cálculo de pontuação
- [ ] Testes de redistribuição de pesos
- [ ] Validação de prompts com diferentes cenários

---

## 📝 **Histórico e Versionamento**

### 18. **Controle de Versão**
- [ ] Manter histórico de avaliações automáticas vs manuais
- [ ] Identificar origem da avaliação (automática/manual)
- [ ] Permitir comparação entre versões
- [ ] Log de mudanças manuais em avaliações automáticas

---

## 🚀 **FASES DE IMPLEMENTAÇÃO**

### **FASE 1 - Estrutura Base**
1. Modelos de dados e tabelas
2. Serviço de IA básico
3. Endpoint de avaliação automática
4. Card básico na página de transcrição

### **FASE 2 - Interface Completa**
1. Componente de resultados
2. Edição manual de itens
3. Integração com páginas existentes
4. Hooks e estados

### **FASE 3 - Persistência**
1. Salvar avaliações no banco
2. Histórico de avaliações
3. Comparação automática vs manual
4. Relatórios e métricas

---

## ❓ **DECISÕES TÉCNICAS**

### **Confirmadas:**
- ✅ Modelo OpenAI: gpt-4.1-mini
- ✅ Limite de aprovação: 70%
- ✅ Critérios vêm da tabela (já inseridos pelo usuário)
- ✅ Interface: novo card na página de transcrição
- ✅ Edição manual: permitida
- ✅ Histórico: mantido

### **Pendentes:**
- [ ] Estrutura do prompt para IA
- [ ] Formato JSON de resposta esperado
- [ ] Critérios padrão para teste
- [ ] Timeout para chamadas da API

---

## 📋 **CHECKLIST DE VALIDAÇÃO**

### **Antes de Implementar:**
- [ ] Confirmar estrutura do prompt
- [ ] Testar API OpenAI com exemplo simples
- [ ] Validar formato JSON de resposta
- [ ] Definir critérios de teste

### **Durante Implementação:**
- [ ] Testar cada endpoint individualmente
- [ ] Validar cálculos de pontuação
- [ ] Testar redistribuição de pesos
- [ ] Validar interface responsiva

### **Após Implementação:**
- [ ] Teste end-to-end completo
- [ ] Validação com dados reais
- [ ] Performance e timeout
- [ ] Tratamento de erros

---

*Última atualização: 2024-12-19*
*Versão: 1.4* 