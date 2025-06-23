# IMPLEMENTAÇÃO DO ENDPOINT /call/{avaliacao_id}/caller

## RESUMO
Este documento contém as instruções completas para implementar o endpoint que retorna informações do número de telefone do cliente baseado no ID da avaliação.

## PROBLEMA
O frontend precisa exibir o número de telefone do cliente na seção "Informações da Ligação" das páginas CallItems, mas o backend atual não fornece essa informação através de uma API dedicada.

## SOLUÇÃO
Criar um novo endpoint `/call/{avaliacao_id}/caller` que faz JOIN entre as tabelas `avaliacoes` e `calls` para retornar o `callerid`.

## ESTRUTURA DO BANCO DE DADOS

### Tabela `avaliacoes`
- **id**: ID da avaliação (chave primária)
- **call_id**: ID da ligação (chave estrangeira para tabela calls)
- outros campos...

### Tabela `calls` 
- **call_id**: ID da ligação (chave primária)
- **callerid**: Número de telefone do cliente
- outros campos...

### Relacionamento
```
avaliacoes.call_id → calls.call_id
```

## IMPLEMENTAÇÃO BACKEND

### 1. Query SQL
Adicione esta query ao arquivo onde você define suas queries SQL (provavelmente models.py ou similar):

```python
SQL_GET_CALLER_INFO = text("""
SELECT 
    av.id as avaliacao_id,
    av.call_id,
    c.callerid
FROM avaliacoes av
LEFT JOIN calls c ON c.call_id = av.call_id
WHERE av.id = :avaliacao_id
LIMIT 1;
""")
```

### 2. Função de Service
Adicione esta função ao seu arquivo principal do FastAPI:

```python
async def get_caller_info(avaliacao_id: str, db: Session = Depends(get_db)):
    try:
        result = db.execute(SQL_GET_CALLER_INFO, {"avaliacao_id": avaliacao_id})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Avaliação com ID {avaliacao_id} não encontrada"
            )
        
        return {
            "avaliacao_id": str(row.avaliacao_id),
            "call_id": str(row.call_id),
            "callerid": row.callerid
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Erro ao buscar caller info: {str(e)}")
        raise HTTPException(status_code=500, detail="Erro interno do servidor")
```

### 3. Endpoint FastAPI
Adicione esta rota ao seu app FastAPI:

```python
@app.get("/call/{avaliacao_id}/caller")
async def get_caller_info_endpoint(avaliacao_id: str, db: Session = Depends(get_db)):
    """
    Busca informações do caller (número de telefone) baseado no ID da avaliação.
    """
    return await get_caller_info(avaliacao_id, db)
```

## RESPOSTA DA API

### Sucesso (200)
```json
{
    "avaliacao_id": "123",
    "call_id": "456789",
    "callerid": "+5511999999999"
}
```

### Avaliação não encontrada (404)
```json
{
    "detail": "Avaliação com ID 123 não encontrada"
}
```

### Erro interno (500)
```json
{
    "detail": "Erro interno do servidor"
}
```

## TESTE

### Via curl
```bash
curl -X GET "http://10.100.20.242:8080/call/123/caller" \
     -H "Accept: application/json"
```

### Via PowerShell
```powershell
Invoke-WebRequest -Uri "http://10.100.20.242:8080/call/123/caller" \
                  -Method GET \
                  -Headers @{"Accept"="application/json"}
```

### Via Frontend
O frontend já está preparado com a função `getCallerInfo()` em `src/lib/api.ts`:
```typescript
export const getCallerInfo = (avaliacaoId: string) => 
    api.get(`/call/${avaliacaoId}/caller`).then(r => r.data);
```

## VALIDAÇÃO

1. **Teste com ID válido**: Deve retornar dados do caller
2. **Teste com ID inválido**: Deve retornar 404
3. **Teste com banco desconectado**: Deve retornar 500
4. **Verifique logs**: Devem aparecer logs informativos/erro conforme apropriado

## FRONTEND

O frontend já está implementado e funcionando nas seguintes páginas:
- `src/pages/CallItems.tsx`
- `src/pages/CallItems-fixed.tsx`

### React Query implementado:
```typescript
const { data: callerInfo } = useQuery({
    queryKey: ['callerInfo', avaliacaoId],
    queryFn: () => getCallerInfo(avaliacaoId!),
    enabled: !!avaliacaoId
});
```

### Display implementado:
```typescript
const newApiPhone = callerInfo?.callerid || callerInfo?.telefone || callerInfo?.numero_cliente;
const finalPhone = newApiPhone || oldApiPhone;
```

## LOGS DE DEBUG

O frontend possui logs extensivos para debugging:
- `🔍 [TESTE CALLERID]`: Logs da API antiga
- `📞 [NOVA API]`: Logs da nova API caller info
- `🎯 [TESTE DISPLAY]`: Logs do display final

## STATUS

- ✅ **Frontend implementado**: API call, React Query, UI components
- 🔄 **Backend pendente**: Implementar endpoint conforme instruções acima
- 🔄 **Teste final**: Após implementação do backend

## PRÓXIMOS PASSOS

1. Implementar o endpoint no backend seguindo as instruções acima
2. Testar o endpoint com curl/PowerShell
3. Verificar se o frontend funciona corretamente
4. Remover logs de debug após confirmação
5. Atualizar grid layout para produção (3 colunas permanentes)
