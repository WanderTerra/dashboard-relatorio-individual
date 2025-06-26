from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from .database import get_db
from .security import verify_token
from .models import check_user_agent_access, get_user_permissions
import logging

logger = logging.getLogger(__name__)

def verify_agent_access(agent_id: str):
    """
    Decorator factory para verificar se o usuário tem acesso aos dados de um agente específico.
    Retorna uma função que pode ser usada como dependency do FastAPI.
    """
    def _verify_access(
        current_user: dict = Depends(verify_token),
        db: Session = Depends(get_db)
    ):
        user_id = current_user.get("user_id") or current_user.get("id")
        
        if not user_id:
            logger.warning(f"User ID não encontrado no token para usuário {current_user.get('username')}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Informações de usuário inválidas"
            )
        
        # Verificar se o usuário tem acesso ao agente
        has_access = check_user_agent_access(db, user_id, agent_id)
        
        if not has_access:
            logger.warning(f"Usuário {current_user.get('username')} (ID: {user_id}) tentou acessar dados do agente {agent_id} sem permissão")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Acesso negado aos dados do agente {agent_id}"
            )
        
        logger.info(f"Acesso autorizado: usuário {current_user.get('username')} pode acessar dados do agente {agent_id}")
        return current_user
    
    return _verify_access

def verify_admin_access(
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Verifica se o usuário tem permissões de administrador.
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Informações de usuário inválidas"
        )
    
    # Buscar permissões do usuário
    permissions = get_user_permissions(db, user_id)
    has_admin = any(perm["name"] == "admin" for perm in permissions)
    
    if not has_admin:
        logger.warning(f"Usuário {current_user.get('username')} tentou acessar função administrativa sem permissão")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acesso negado. Permissões de administrador necessárias."
        )
    
    return current_user

def get_user_accessible_agents(
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
) -> list:
    """
    Retorna a lista de agent_ids que o usuário pode acessar.
    Se for admin, retorna lista vazia (indicando acesso total).
    """
    user_id = current_user.get("user_id") or current_user.get("id")
    
    if not user_id:
        return []
    
    permissions = get_user_permissions(db, user_id)
    
    # Se é admin, tem acesso total
    if any(perm["name"] == "admin" for perm in permissions):
        return []  # Lista vazia indica acesso total
    
    # Extrair agent_ids das permissões específicas
    accessible_agents = []
    for perm in permissions:
        if perm["name"].startswith("agent_"):
            agent_id = perm["name"].replace("agent_", "")
            accessible_agents.append(agent_id)
    
    return accessible_agents
