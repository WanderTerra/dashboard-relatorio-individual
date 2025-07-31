from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.security import verify_admin_access

router = APIRouter(prefix="/criterios", tags=["criterios"])

@router.get("/")
def listar_criterios(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    return {"message": "Endpoint de critérios - em desenvolvimento"}