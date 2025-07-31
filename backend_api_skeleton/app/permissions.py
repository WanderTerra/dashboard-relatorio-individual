from fastapi import Depends, HTTPException, status
from .security import verify_token

def verify_admin_access(current_user: dict = Depends(verify_token)):
    """Verifica se o usuário tem permissão de admin"""
    if "admin" not in current_user.get("permissions", []):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso restrito a administradores"
        )
    return current_user 