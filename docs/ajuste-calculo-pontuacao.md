# 🔧 Ajuste no Cálculo de Pontuação - Critérios "Não se Aplica"

## 🎯 **Problema Identificado**

Atualmente, o dashboard está considerando **todos os critérios** no cálculo da pontuação média, incluindo aqueles marcados como "Não se aplica". Isso distorce os resultados porque:

### ❌ **Situação Atual:**
- Critérios "Conforme" = ✅ (contam para a nota)
- Critérios "Não Conforme" = ❌ (contam para a nota)
- Critérios "Não se Aplica" = ⚠️ (contam para a nota, mas não deveriam)

### ✅ **Situação Desejada:**
- Critérios "Conforme" = ✅ (contam para a nota)
- Critérios "Não Conforme" = ❌ (contam para a nota)
- Critérios "Não se Aplica" = 🔒 (NÃO contam para a nota)

## 📊 **Exemplo Prático**

**Cenário:** Agente tem 3 critérios avaliados:
1. **Abordagem:** Conforme (100%)
2. **Confirmação de valores:** Não se aplica (0%)
3. **Cordialidade:** Conforme (100%)

### ❌ **Cálculo Atual (INCORRETO):**
```
Pontuação = (100 + 0 + 100) / 3 = 66.7%
Status: REPROVADO (< 70%)
```

### ✅ **Cálculo Correto (DESEJADO):**
```
Pontuação = (100 + 100) / 2 = 100%
Status: APROVADO (≥ 70%)
```

## 🚨 **Por que "Não se Aplica" não deve contar?**

1. **Não é eliminatório:** O critério não afeta a qualidade da ligação
2. **Contexto específico:** Exemplo: cliente encerrou antes da confirmação de valores
3. **Distorção de resultados:** Critérios válidos ficam penalizados
4. **Lógica de negócio:** Se não se aplica, não deve influenciar a nota

## 🔧 **Solução Necessária**

### **Backend (Python/FastAPI):**

Ajustar a função de cálculo de KPIs para filtrar critérios "Não se aplica":

```python
def calcular_pontuacao_media(avaliacoes):
    pontuacoes_validas = []
    
    for avaliacao in avaliacoes:
        # Filtrar apenas critérios válidos (Conforme/Não Conforme)
        criterios_validos = [
            c for c in avaliacao.criterios 
            if c.resultado not in ['NAO SE APLICA', 'NÃO SE APLICA']
        ]
        
        if criterios_validos:
            # Calcular pontuação apenas dos critérios válidos
            pontuacao = calcular_pontuacao_criterios(criterios_validos)
            pontuacoes_validas.append(pontuacao)
    
    return sum(pontuacoes_validas) / len(pontuacoes_validos) if pontuacoes_validas else 0
```

### **Frontend (React):**

O frontend já está correto - ele apenas exibe os dados calculados pelo backend.

## 📍 **Arquivos que Precisam ser Ajustados**

### **Backend:**
- `app/api/kpis.py` - Endpoint de KPIs
- `app/services/avaliacao_service.py` - Lógica de cálculo
- `app/models/avaliacao.py` - Modelos de dados

### **Frontend:**
- ✅ **Nenhum ajuste necessário** - apenas exibe dados do backend

## 🎯 **Resultado Esperado**

Após o ajuste:

1. **Dashboard mostrará pontuações mais precisas**
2. **Agentes não serão penalizados por critérios que não se aplicam**
3. **Métricas refletirão a qualidade real das ligações**
4. **Status de aprovação/reprovação será mais justo**

## ⚠️ **Considerações Importantes**

1. **Histórico:** Dados antigos podem precisar de recálculo
2. **Consistência:** Aplicar a mesma lógica em todos os endpoints
3. **Testes:** Validar com diferentes cenários de critérios
4. **Documentação:** Atualizar documentação da API

## 🚀 **Próximos Passos**

1. **Backend:** Implementar filtro de critérios "Não se aplica"
2. **Testes:** Validar cálculo com dados reais
3. **Deploy:** Aplicar em ambiente de produção
4. **Monitoramento:** Acompanhar impacto nas métricas 