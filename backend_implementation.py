# Implementação do endpoint /call/{avaliacao_id}/caller para o backend FastAPI
# Este arquivo contém as queries SQL e código FastAPI necessários

from fastapi import FastAPI, HTTPException, Depends
from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional
import logging

# Query SQL para buscar informações do caller
# Esta query faz JOIN entre as tabelas avaliacoes e calls para obter o callerid
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

# Modelo de resposta para o endpoint
class CallerInfoResponse:
    def __init__(self, avaliacao_id: str, call_id: str, callerid: Optional[str]):
        self.avaliacao_id = avaliacao_id
        self.call_id = call_id
        self.callerid = callerid
        
    def dict(self):
        return {
            "avaliacao_id": self.avaliacao_id,
            "call_id": self.call_id,
            "callerid": self.callerid
        }

# Implementação do endpoint FastAPI
# Adicione esta função ao seu arquivo principal do FastAPI (main.py ou similar)

async def get_caller_info(avaliacao_id: str, db: Session = Depends(get_db)):
    """
    Endpoint para buscar informações do caller (número de telefone) baseado no ID da avaliação.
    
    Args:
        avaliacao_id: ID da avaliação
        db: Sessão do banco de dados
        
    Returns:
        Informações do caller incluindo o número de telefone
        
    Raises:
        HTTPException: 404 se a avaliação não for encontrada
        HTTPException: 500 em caso de erro no banco de dados
    """
    try:
        # Executar a query
        result = db.execute(SQL_GET_CALLER_INFO, {"avaliacao_id": avaliacao_id})
        row = result.fetchone()
        
        if not row:
            raise HTTPException(
                status_code=404, 
                detail=f"Avaliação com ID {avaliacao_id} não encontrada"
            )
        
        # Criar resposta
        caller_info = CallerInfoResponse(
            avaliacao_id=str(row.avaliacao_id),
            call_id=str(row.call_id),
            callerid=row.callerid
        )
        
        logging.info(f"Caller info encontrado para avaliação {avaliacao_id}: {caller_info.dict()}")
        
        return caller_info.dict()
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        logging.error(f"Erro ao buscar caller info para avaliação {avaliacao_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Erro interno do servidor ao buscar informações do caller"
        )

# Adicione esta rota ao seu app FastAPI:
# @app.get("/call/{avaliacao_id}/caller")
# async def get_caller_info_endpoint(avaliacao_id: str, db: Session = Depends(get_db)):
#     return await get_caller_info(avaliacao_id, db)

"""
INSTRUÇÕES PARA IMPLEMENTAÇÃO:

1. Adicione a query SQL_GET_CALLER_INFO ao arquivo onde você define suas queries SQL

2. Adicione a função get_caller_info ao seu arquivo principal do FastAPI

3. Adicione a rota ao seu app FastAPI:

@app.get("/call/{avaliacao_id}/caller")
async def get_caller_info_endpoint(avaliacao_id: str, db: Session = Depends(get_db)):
    return await get_caller_info(avaliacao_id, db)

4. Teste o endpoint:
   GET http://10.100.20.242:8080/call/{avaliacao_id}/caller

5. Resposta esperada:
{
    "avaliacao_id": "123",
    "call_id": "456", 
    "callerid": "+5511999999999"
}

ESTRUTURA DO BANCO:
- Tabela 'avaliacoes': tem campo 'call_id' que faz referência à tabela 'calls'
- Tabela 'calls': tem campo 'callerid' com o número do telefone do cliente

QUERY EXPLICADA:
- Faz LEFT JOIN entre avaliacoes e calls usando call_id
- Retorna avaliacao_id, call_id e callerid
- LEFT JOIN garante que mesmo se não houver call correspondente, a avaliação será retornada
- LIMIT 1 garante que apenas um resultado seja retornado
"""
