from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import logging

# Setup logging
logger = logging.getLogger(__name__)

from ..security import (
    authenticate_user, 
    create_access_token, 
    get_password_hash,
    is_temp_password,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    verify_token
)
from ..database import get_db
from ..models import create_user, update_user_password

router = APIRouter()

# === MODELS ===

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserResponse(BaseModel):
    id: int
    username: str
    full_name: Optional[str] = None
    active: bool

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class CreateUserRequest(BaseModel):
    username: str
    full_name: str

# === ENDPOINTS ===

@router.post("/token", response_model=Token)
async def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """Endpoint de login - retorna JWT token"""
    logger.info(f"🔐 LOGIN ATTEMPT - Username: {form_data.username}")
    logger.info(f"📝 Form data received: username={form_data.username}, password_length={len(form_data.password) if form_data.password else 0}")
    
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário ou senha incorretos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    if not user["active"]:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuário inativo",
        )

    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "user_id": user["id"]}, expires_delta=access_token_expires
    )
    
    # Verificar se é senha temporária
    requires_password_change = is_temp_password(form_data.password)
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "active": user["active"],
            "requires_password_change": requires_password_change
        }
    }

@router.get("/me", response_model=UserResponse)
async def read_users_me(
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Retorna informações do usuário logado"""
    from ..models import get_user_by_username
    
    user = get_user_by_username(db, current_user["username"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    return UserResponse(
        id=user["id"],
        username=user["username"],
        full_name=user["full_name"],
        active=user["active"]
    )

@router.post("/change-password")
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Alterar senha do usuário"""
    from ..models import get_user_by_username
    
    # Verificar senha atual
    user = get_user_by_username(db, current_user["username"])
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuário não encontrado"
        )
    
    from ..security import verify_password
    if not verify_password(password_data.current_password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Senha atual incorreta"
        )
    
    # Validar nova senha
    if len(password_data.new_password) < 8:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nova senha deve ter pelo menos 8 caracteres"
        )
    
    # Atualizar senha
    new_password_hash = get_password_hash(password_data.new_password)
    success = update_user_password(db, current_user["username"], new_password_hash)
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao atualizar senha"
        )
    
    return {"message": "Senha atualizada com sucesso"}

@router.post("/create-user")
async def create_new_user(
    user_data: CreateUserRequest,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Criar novo usuário (apenas para administradores por enquanto)"""
    # Por enquanto, qualquer usuário logado pode criar outro usuário
    # Depois implementamos controle de permissões
    
    # Verificar se username já existe
    from ..models import get_user_by_username
    existing_user = get_user_by_username(db, user_data.username)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Nome de usuário já existe"
        )
    
    # Criar usuário com senha temporária
    temp_password = "Temp@2025"
    password_hash = get_password_hash(temp_password)
    
    success = create_user(
        db=db,
        username=user_data.username,
        password_hash=password_hash,
        full_name=user_data.full_name,
        active=True
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Erro ao criar usuário"
        )
    
    return {
        "message": f"Usuário {user_data.username} criado com sucesso",
        "username": user_data.username,
        "temporary_password": temp_password
    }
