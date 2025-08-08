from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List
from app.permissions import verify_admin_access

router = APIRouter(prefix="/carteira_criterios", tags=["carteira_criterios"])

class CarteiraCriterioCreate(BaseModel):
    carteira_id: int
    criterio_id: int
    ordem: Optional[int] = None
    peso_especifico: Optional[float] = None

class CarteiraCriterioOut(CarteiraCriterioCreate):
    id: int

@router.get("/carteira/{carteira_id}", response_model=List[CarteiraCriterioOut])
def listar_criterios_da_carteira(
    carteira_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    """Lista associações de critérios de uma carteira específica"""
    try:
        # Verificar se a carteira existe
        carteira = db.execute(
            text("SELECT id FROM carteiras WHERE id = :carteira_id"),
            {"carteira_id": carteira_id}
        ).fetchone()
        
        if not carteira:
            raise HTTPException(status_code=404, detail="Carteira não encontrada")
        
        # Buscar associações da carteira (dados da tabela carteira_criterios)
        result = db.execute(
            text("""
                SELECT id, carteira_id, criterio_id, ordem, peso_especifico 
                FROM carteira_criterios 
                WHERE carteira_id = :carteira_id
                ORDER BY ordem, id
            """),
            {"carteira_id": carteira_id}
        ).mappings().all()
        
        return [dict(row) for row in result]
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro ao buscar critérios da carteira: {str(e)}")

@router.post("/", response_model=CarteiraCriterioOut, status_code=status.HTTP_201_CREATED)
def adicionar_criterio_na_carteira(assoc: CarteiraCriterioCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_access)):
    result = db.execute(
        text("INSERT INTO carteira_criterios (carteira_id, criterio_id, ordem, peso_especifico) VALUES (:carteira_id, :criterio_id, :ordem, :peso_especifico)"),
        assoc.dict()
    )
    db.commit()
    id = result.lastrowid
    return {**assoc.dict(), "id": id}

@router.delete("/{assoc_id}", status_code=status.HTTP_204_NO_CONTENT)
def remover_criterio_da_carteira(assoc_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_access)):
    result = db.execute(
        text("DELETE FROM carteira_criterios WHERE id=:id"),
        {"id": assoc_id}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Associação não encontrada")