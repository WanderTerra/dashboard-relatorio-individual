from sqlalchemy.orm import Session
from sqlalchemy import text

def ensure_user_exists(db: Session, username: str, full_name: str):
    """Garante que um usuário existe, criando se necessário"""
    # Verificar se o usuário já existe
    user = db.execute(text("SELECT id, username, full_name FROM users WHERE username = :username"), 
                      {"username": username}).fetchone()
    
    if user:
        # Atualizar nome se necessário
        if user.full_name != full_name:
            db.execute(text("UPDATE users SET full_name = :full_name WHERE id = :id"), 
                       {"full_name": full_name, "id": user.id})
            db.commit()
        return {"id": user.id, "username": user.username, "full_name": full_name}
    
    # Criar novo usuário
    result = db.execute(text("INSERT INTO users (username, full_name, active) VALUES (:username, :full_name, :active)"), 
                        {"username": username, "full_name": full_name, "active": True})
    db.commit()
    
    return {"id": result.lastrowid, "username": username, "full_name": full_name} 