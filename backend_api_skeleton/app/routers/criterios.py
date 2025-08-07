from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.security import verify_admin_access
from typing import List
from pydantic import BaseModel

router = APIRouter(prefix="/criterios", tags=["criterios"])

class CriterioOut(BaseModel):
    id: int
    nome: str
    descricao: str
    categoria: str
    ativo: bool

@router.get("/", response_model=List[CriterioOut])
def listar_criterios(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    """Lista todos os critérios disponíveis"""
    try:
        result = db.execute(
            text("SELECT id, nome, descricao, categoria, ativo FROM criterios WHERE ativo = 1")
        ).mappings().all()
        return [dict(row) for row in result]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar critérios: {str(e)}")

@router.get("/carteira/{carteira_id}", response_model=List[CriterioOut])
def listar_criterios_carteira(
    carteira_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    """Lista critérios associados a uma carteira específica"""
    try:
        # Verificar se a carteira existe
        carteira = db.execute(
            text("SELECT id FROM carteiras WHERE id = :carteira_id"),
            {"carteira_id": carteira_id}
        ).fetchone()
        
        if not carteira:
            raise HTTPException(status_code=404, detail="Carteira não encontrada")
        
        # Buscar critérios da carteira
        result = db.execute(
            text("""
                SELECT c.id, c.nome, c.descricao, c.categoria, c.ativo
                FROM criterios c
                INNER JOIN carteira_criterios cc ON c.id = cc.criterio_id
                WHERE cc.carteira_id = :carteira_id AND c.ativo = 1
                ORDER BY cc.ordem, c.nome
            """),
            {"carteira_id": carteira_id}
        ).mappings().all()
        
        return [dict(row) for row in result]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar critérios da carteira: {str(e)}")