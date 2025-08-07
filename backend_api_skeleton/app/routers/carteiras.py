from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from pydantic import BaseModel
from typing import Optional, List
from app.permissions import verify_admin_access
from sqlalchemy import text

router = APIRouter(prefix="/carteiras", tags=["carteiras"])

class CarteiraCreate(BaseModel):
    nome: str
    descricao: Optional[str] = None
    ativo: Optional[bool] = True

class CarteiraOut(CarteiraCreate):
    id: int

@router.get("/", response_model=List[CarteiraOut])
def listar_carteiras(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    result = db.execute(text("SELECT id, nome, descricao, ativo FROM carteiras")).mappings().all()
    return result

@router.post("/", response_model=CarteiraOut, status_code=status.HTTP_201_CREATED)
def criar_carteira(carteira: CarteiraCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_access)):
    result = db.execute(
        text("INSERT INTO carteiras (nome, descricao, ativo) VALUES (:nome, :descricao, :ativo)"),
        carteira.dict()
    )
    db.commit()
    id = result.lastrowid
    return {**carteira.dict(), "id": id}

@router.put("/{carteira_id}", response_model=CarteiraOut)
def editar_carteira(carteira_id: int, carteira: CarteiraCreate, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_access)):
    result = db.execute(
        text("UPDATE carteiras SET nome=:nome, descricao=:descricao, ativo=:ativo WHERE id=:id"),
        {**carteira.dict(), "id": carteira_id}
    )
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Carteira não encontrada")
    return {**carteira.dict(), "id": carteira_id}

@router.delete("/{carteira_id}", status_code=status.HTTP_204_NO_CONTENT)
def deletar_carteira(carteira_id: int, db: Session = Depends(get_db), current_user: dict = Depends(verify_admin_access)):
    result = db.execute(text("DELETE FROM carteiras WHERE id=:id"), {"id": carteira_id})
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Carteira não encontrada")

@router.get("/{carteira_id}/criterios", response_model=List[dict])
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