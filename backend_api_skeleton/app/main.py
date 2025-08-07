from fastapi import FastAPI, Depends, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel

from .database import get_db
from .security import verify_token, verify_admin_access
from .routers import carteiras, criterios, transcricao_scribe, avaliacao

app = FastAPI(title="Dashboard API", version="1.0.0")

# Configuração CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir routers
app.include_router(carteiras.router, prefix="/api")
app.include_router(criterios.router, prefix="/api")
app.include_router(transcricao_scribe.router, prefix="/api")
app.include_router(avaliacao.router, prefix="/api")

# Modelos Pydantic
class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    active: Optional[bool] = None

# Endpoints de usuários
@app.put("/admin/users/{user_id}")
def editar_usuario(
    user_id: int,
    user_update: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    if "admin" not in current_user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    # Monta a query dinamicamente conforme os campos enviados
    fields = []
    values = {}
    if user_update.full_name is not None:
        fields.append("full_name = :full_name")
        values["full_name"] = user_update.full_name
    if user_update.active is not None:
        fields.append("active = :active")
        values["active"] = user_update.active
    if not fields:
        raise HTTPException(status_code=400, detail="Nenhum campo para atualizar")
    values["user_id"] = user_id
    query = f"UPDATE users SET {', '.join(fields)} WHERE id = :user_id"
    result = db.execute(text(query), values)
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Usuário atualizado com sucesso"}

@app.post("/admin/users/{user_id}/reset-password")
def resetar_senha_usuario(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    if "admin" not in current_user.get("permissions", []):
        raise HTTPException(status_code=403, detail="Acesso restrito a administradores")
    from .security import get_password_hash
    nova_senha = "Temp@2025"
    nova_senha_hash = get_password_hash(nova_senha)
    result = db.execute(text("UPDATE users SET password_hash = :password_hash WHERE id = :user_id"), {
        "password_hash": nova_senha_hash,
        "user_id": user_id
    })
    db.commit()
    if result.rowcount == 0:
        raise HTTPException(status_code=404, detail="Usuário não encontrado")
    return {"message": "Senha resetada com sucesso", "temporary_password": nova_senha} 

@app.post("/admin/ensure-user")
def ensure_user_endpoint(
    username: str = Body(...),
    full_name: str = Body(...),
    permissions: Optional[list[str]] = Body(default=None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    from .models import ensure_user_exists
    user = ensure_user_exists(db, username, full_name)
    
    if permissions:
        # Para cada permissão, atribuir ao usuário
        user_id = user["id"]
        for perm_name in permissions:
            # Buscar id da permissão
            perm_id = db.execute(text("SELECT id FROM permissions WHERE name = :name"), {"name": perm_name}).scalar()
            if not perm_id:
                # Cria permissão se não existir
                db.execute(text("INSERT INTO permissions (name, description) VALUES (:name, :desc)"),
                           {"name": perm_name, "desc": f"Permissão {perm_name}"})
                perm_id = db.execute(text("SELECT id FROM permissions WHERE name = :name"), {"name": perm_name}).scalar()
            
            # Verifica se já tem
            exists = db.execute(text("SELECT 1 FROM user_permissions WHERE user_id = :user_id AND permission_id = :perm_id"),
                                {"user_id": user_id, "perm_id": perm_id}).scalar()
            if not exists:
                db.execute(text("INSERT INTO user_permissions (user_id, permission_id) VALUES (:user_id, :perm_id)"),
                           {"user_id": user_id, "perm_id": perm_id})
        db.commit()
    
    return {"user": user}

@app.get("/carteiras-avaliacoes")
def get_carteiras_from_avaliacoes(
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retorna lista de carteiras únicas da tabela avaliacoes.
    Usado para filtros no Dashboard.
    """
    try:
        logger.info("🔍 Endpoint /carteiras-avaliacoes chamado")
        
        # Query para buscar carteiras únicas e não nulas
        stmt = text("""
            SELECT DISTINCT carteira as nome
            FROM avaliacoes 
            WHERE carteira IS NOT NULL 
            AND carteira != ''
            ORDER BY carteira
        """)
        
        result = db.execute(stmt).mappings().all()
        logger.info(f"📊 Encontradas {len(result)} carteiras únicas")
        
        # Converter para o formato esperado pelo frontend
        carteiras = [
            {"value": row.nome, "label": row.nome}
            for row in result
        ]
        
        logger.info(f"✅ Retornando carteiras: {[c['value'] for c in carteiras]}")
        return carteiras
        
    except Exception as e:
        logger.error(f"❌ Erro ao buscar carteiras: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno ao buscar carteiras: {str(e)}"
        )

# Health check
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "API funcionando corretamente"} 