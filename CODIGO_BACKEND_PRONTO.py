# ENDPOINT CALLER INFO - CÓDIGO PRONTO PARA USAR
# Copie e cole este código no seu arquivo principal do FastAPI

# =============================================================================
# 1. QUERY SQL - Adicione às suas queries existentes
# =============================================================================

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

# =============================================================================
# 2. ENDPOINT FASTAPI - Adicione ao seu app
# =============================================================================

@app.get("/call/{avaliacao_id}/caller")
async def get_caller_info(avaliacao_id: str, db: Session = Depends(get_db)):
    """
    Busca informações do caller (número de telefone) baseado no ID da avaliação.
    
    Args:
        avaliacao_id: ID da avaliação
        
    Returns:
        dict: Informações do caller
        {
            "avaliacao_id": "123",
            "call_id": "456789",
            "callerid": "+5511999999999"
        }
        
    Raises:
        HTTPException: 404 se não encontrado, 500 em caso de erro
    """
    try:
        # Executar query
        result = db.execute(SQL_GET_CALLER_INFO, {"avaliacao_id": avaliacao_id})
        row = result.fetchone()
        
        # Verificar se encontrou
        if not row:
            raise HTTPException(
                status_code=404,
                detail=f"Avaliação com ID {avaliacao_id} não encontrada"
            )
        
        # Retornar dados
        return {
            "avaliacao_id": str(row.avaliacao_id),
            "call_id": str(row.call_id) if row.call_id else None,
            "callerid": row.callerid
        }
        
    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise
        
    except Exception as e:
        # Log e retorna erro 500
        import logging
        logging.error(f"Erro ao buscar caller info para avaliação {avaliacao_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor ao buscar informações do caller"
        )

# =============================================================================
# 3. IMPORTS NECESSÁRIOS - Adicione no topo do arquivo se não existirem
# =============================================================================

# from fastapi import FastAPI, HTTPException, Depends
# from sqlalchemy import text
# from sqlalchemy.orm import Session
# import logging

# =============================================================================
# 4. TESTE RÁPIDO - Execute após implementar
# =============================================================================

# PowerShell:
# Invoke-WebRequest -Uri "http://10.100.20.242:8080/call/1/caller" -Method GET

# curl:
# curl -X GET "http://10.100.20.242:8080/call/1/caller"

# =============================================================================
# 5. RESPOSTA ESPERADA
# =============================================================================

# Sucesso (200):
# {
#     "avaliacao_id": "1",
#     "call_id": "123456",
#     "callerid": "+5511999999999"
# }

# Não encontrado (404):
# {
#     "detail": "Avaliação com ID 1 não encontrada"
# }

# =============================================================================
# 6. CHECKLIST DE IMPLEMENTAÇÃO
# =============================================================================

"""
□ 1. Adicionar SQL_GET_CALLER_INFO às queries
□ 2. Adicionar função get_caller_info ao app
□ 3. Adicionar rota @app.get("/call/{avaliacao_id}/caller")
□ 4. Verificar imports (FastAPI, HTTPException, Depends, text, Session, logging)
□ 5. Testar com PowerShell ou curl
□ 6. Verificar resposta JSON
□ 7. Testar frontend (CallItems.tsx)
□ 8. Validar logs no backend
"""
