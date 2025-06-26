from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from .database import get_db
import logging

# Configurações de segurança
SECRET_KEY = "dashboard-vonix-jwt-2025-secret!"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 480  # 8 horas

# Configuração para hash de senhas
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Configuração para Bearer token
security = HTTPBearer()

# Configuração do logger
logger = logging.getLogger(__name__)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha está correta"""
    try:
        logger.debug(f"🔐 Verifying password. Hash starts with: {hashed_password[:20] if hashed_password else 'None'}...")
        result = pwd_context.verify(plain_password, hashed_password)
        logger.debug(f"🔐 Password verification result: {result}")
        return result
    except Exception as e:
        logger.error(f"❌ Error in password verification: {e}")
        return False

def get_password_hash(password: str) -> str:
    """Gera hash da senha"""
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica e decodifica token JWT"""
    token = credentials.credentials
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciais inválidas",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    return {"username": username}

def authenticate_user(db: Session, username: str, password: str):
    """Autentica usuário e retorna dados do usuário se válido"""
    from .models import get_user_by_username
    
    logger.info(f"🔍 Authenticating user: {username}")
    user = get_user_by_username(db, username)
    if not user:
        logger.warning(f"❌ User {username} not found in database")
        return False
    
    logger.info(f"✅ User {username} found, checking password")
    logger.debug(f"User data: {user}")
    
    if not verify_password(password, user["password_hash"]):
        logger.warning(f"❌ Password verification failed for user {username}")
        return False
    
    logger.info(f"✅ Authentication successful for user {username}")
    return user

def is_temp_password(password: str) -> bool:
    """Verifica se é a senha temporária padrão"""
    return password == "Temp@2025"
