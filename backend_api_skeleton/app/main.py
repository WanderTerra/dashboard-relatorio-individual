from pydantic import BaseModel

class UserUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    active: Optional[bool] = None

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