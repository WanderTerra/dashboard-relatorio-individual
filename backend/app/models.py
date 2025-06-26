from sqlalchemy import text
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any

# SQL queries for user management
SQL_GET_USER = text("""
SELECT 
    id,
    username,
    password_hash,
    full_name,
    active
FROM users 
WHERE username = :username
LIMIT 1;
""")

SQL_CREATE_USER = text("""
INSERT INTO users (username, password_hash, full_name, active)
VALUES (:username, :password_hash, :full_name, :active);
""")

SQL_UPDATE_PASSWORD = text("""
UPDATE users 
SET password_hash = :password_hash
WHERE username = :username;
""")

# SQL query to create users table if it doesn't exist (simplified version)
SQL_CREATE_USERS_TABLE = text("""
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    active BOOLEAN DEFAULT TRUE
);
""")

# Dashboard Data SQL Queries
SQL_KPI_AVG = text("""SELECT ROUND(AVG(pontuacao),2) AS media_geral
FROM avaliacoes
WHERE data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR carteira = :carteira);""")

SQL_KPI_QTD = text("""SELECT COUNT(*) AS total_ligacoes
FROM avaliacoes
WHERE data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR carteira = :carteira);""")

SQL_KPI_PIOR_ITEM = text("""SELECT ia.categoria,
   SUM(ia.resultado = 'NAO CONFORME') AS nao_conformes,
   SUM(ia.resultado = 'CONFORME') AS conformes,
   ROUND(100 * SUM(ia.resultado = 'NAO CONFORME') /
        NULLIF(SUM(ia.resultado IN ('CONFORME','NAO CONFORME')),0),1) AS pct_nao_conforme
FROM itens_avaliados ia
JOIN avaliacoes av ON av.id = ia.avaliacao_id
WHERE av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY ia.categoria
ORDER BY pct_nao_conforme DESC
LIMIT 1;""")

SQL_TREND_GLOBAL = text("""SELECT DATE(av.data_ligacao) AS dia,
   ROUND(AVG(av.pontuacao),2) AS media
FROM avaliacoes av
WHERE av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY dia
ORDER BY dia;""")

SQL_AGENTS_RANK = text("""SELECT ag.id AS agent_id, ag.name AS nome,
   COUNT(av.id) AS ligacoes,
   ROUND(AVG(av.pontuacao),1) AS media
FROM avaliacoes av
JOIN agents ag ON ag.id = av.agent_id
WHERE av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY ag.id, ag.name
ORDER BY media DESC;""")

SQL_AGENT_SUMMARY = text("""SELECT ag.id AS agent_id, ag.name,
   COUNT(av.id) AS ligacoes,
   ROUND(AVG(av.pontuacao),2) AS media
FROM avaliacoes av
JOIN agents ag ON ag.id = av.agent_id
WHERE av.agent_id = :agent_id
  AND av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira);""")

SQL_AGENT_CRITERIA_RADAR = text("""SELECT ia.categoria,
   ROUND(AVG(ia.resultado = 'CONFORME')*100,1) AS pct_conforme
FROM itens_avaliados ia
JOIN avaliacoes av ON av.id = ia.avaliacao_id
WHERE av.agent_id = :agent_id
  AND av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY ia.categoria;""")

SQL_AGENT_TREND = text("""SELECT DATE(av.data_ligacao) AS dia,
   ROUND(AVG(av.pontuacao),2) AS media
FROM avaliacoes av
WHERE av.agent_id = :agent_id
  AND av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY dia
ORDER BY dia;""")

SQL_AGENT_ITEMS_TREND = text("""SELECT ia.categoria, DATE(av.data_ligacao) AS dia,
   SUM(ia.resultado = 'CONFORME') AS conformes,
   SUM(ia.resultado = 'NAO CONFORME') AS nao_conformes
FROM itens_avaliados ia
JOIN avaliacoes av ON av.id = ia.avaliacao_id
WHERE av.agent_id = :agent_id
  AND av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
GROUP BY ia.categoria, dia
ORDER BY ia.categoria, dia;""")

SQL_AGENT_CALLS = text("""SELECT av.id AS avaliacao_id, av.call_id,
   av.data_ligacao, av.pontuacao, av.status_avaliacao
FROM avaliacoes av
WHERE av.agent_id = :agent_id
  AND av.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR av.carteira = :carteira)
ORDER BY av.data_ligacao DESC;""")

SQL_CALL_ITEMS = text("""SELECT categoria, descricao, resultado, peso
FROM itens_avaliados
WHERE avaliacao_id = :avaliacao_id;""")

SQL_CALL_TRANSCRIPTION = text("""SELECT conteudo FROM transcricoes
WHERE avaliacao_id = :avaliacao_id;""")

SQL_AGENT_WORST_ITEM = text("""
SELECT
  ia.categoria,
  SUM(CASE WHEN ia.resultado = 'NAO CONFORME' THEN 1 ELSE 0 END) AS qtd_nao_conforme,
  COUNT(*) AS total_avaliacoes_item,
  (SUM(CASE WHEN ia.resultado = 'NAO CONFORME' THEN 1 ELSE 0 END) * 1.0 / COUNT(*)) AS taxa_nao_conforme
FROM itens_avaliados ia
JOIN avaliacoes a
  ON ia.avaliacao_id = a.id
WHERE a.agent_id   = :agent_id
  AND a.data_ligacao BETWEEN :start AND :end
  AND (:carteira IS NULL OR a.carteira = :carteira)
GROUP BY ia.categoria
ORDER BY taxa_nao_conforme DESC
LIMIT 1;
""")

# =============================================================================
# PERMISSIONS SYSTEM
# =============================================================================

# SQL queries for permissions
SQL_GET_USER_PERMISSIONS = text("""
SELECT 
    p.id as permission_id,
    p.name as permission_name,
    p.description as permission_description
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
WHERE up.user_id = :user_id;
""")

SQL_CREATE_PERMISSION = text("""
INSERT INTO permissions (name, description)
VALUES (:name, :description);
""")

SQL_ASSIGN_PERMISSION = text("""
INSERT INTO user_permissions (user_id, permission_id)
VALUES (:user_id, :permission_id);
""")

SQL_GET_PERMISSION_BY_NAME = text("""
SELECT id, name, description
FROM permissions 
WHERE name = :name
LIMIT 1;
""")

SQL_CHECK_USER_AGENT_ACCESS = text("""
SELECT 
    p.name as permission_name,
    p.description
FROM user_permissions up
JOIN permissions p ON p.id = up.permission_id
WHERE up.user_id = :user_id 
  AND (p.name = 'admin' OR p.name = :agent_permission)
LIMIT 1;
""")

def get_user_by_username(db: Session, username: str) -> Optional[Dict[str, Any]]:
    """Busca usuário pelo username"""
    try:
        result = db.execute(SQL_GET_USER, {"username": username})
        row = result.fetchone()
        if row:
            return {
                "id": row.id,
                "username": row.username,
                "password_hash": row.password_hash,
                "full_name": row.full_name,
                "active": bool(row.active)
            }
        return None
    except Exception as e:
        print(f"Erro ao buscar usuário: {e}")
        return None

def create_user(db: Session, username: str, password_hash: str, full_name: str, active: bool = True):
    """Cria novo usuário"""
    try:
        db.execute(SQL_CREATE_USER, {
            "username": username,
            "password_hash": password_hash,
            "full_name": full_name,
            "active": active
        })
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar usuário: {e}")
        return False

def update_user_password(db: Session, username: str, new_password_hash: str):
    """Atualiza senha do usuário"""
    try:
        db.execute(SQL_UPDATE_PASSWORD, {
            "username": username,
            "password_hash": new_password_hash
        })
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Erro ao atualizar senha: {e}")
        return False

def ensure_users_table_exists(db: Session):
    """Garante que a tabela users existe"""
    try:
        db.execute(SQL_CREATE_USERS_TABLE)
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar tabela users: {e}")
        return False

def get_user_permissions(db: Session, user_id: int) -> list:
    """Busca todas as permissões de um usuário"""
    try:
        result = db.execute(SQL_GET_USER_PERMISSIONS, {"user_id": user_id})
        permissions = []
        for row in result.mappings():
            permissions.append({
                "id": row.permission_id,
                "name": row.permission_name,
                "description": row.permission_description
            })
        return permissions
    except Exception as e:
        print(f"Erro ao buscar permissões do usuário {user_id}: {e}")
        return []

def create_permission(db: Session, name: str, description: str = None) -> bool:
    """Cria uma nova permissão"""
    try:
        db.execute(SQL_CREATE_PERMISSION, {"name": name, "description": description})
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Erro ao criar permissão {name}: {e}")
        return False

def get_permission_by_name(db: Session, name: str) -> Optional[Dict[str, Any]]:
    """Busca uma permissão pelo nome"""
    try:
        result = db.execute(SQL_GET_PERMISSION_BY_NAME, {"name": name})
        row = result.mappings().first()
        if row:
            return {
                "id": row.id,
                "name": row.name,
                "description": row.description
            }
        return None
    except Exception as e:
        print(f"Erro ao buscar permissão {name}: {e}")
        return None

def assign_permission_to_user(db: Session, user_id: int, permission_id: int) -> bool:
    """Atribui uma permissão a um usuário"""
    try:
        db.execute(SQL_ASSIGN_PERMISSION, {"user_id": user_id, "permission_id": permission_id})
        db.commit()
        return True
    except Exception as e:
        db.rollback()
        print(f"Erro ao atribuir permissão {permission_id} ao usuário {user_id}: {e}")
        return False

def check_user_agent_access(db: Session, user_id: int, agent_id: str) -> bool:
    """
    Verifica se o usuário tem acesso aos dados de um agente específico.
    Retorna True se:
    - Usuário tem permissão 'admin' (acesso total)
    - Usuário tem permissão específica para o agente (ex: 'agent_1116')
    """
    try:
        agent_permission = f"agent_{agent_id}"
        result = db.execute(SQL_CHECK_USER_AGENT_ACCESS, {
            "user_id": user_id, 
            "agent_permission": agent_permission
        })
        row = result.mappings().first()
        return row is not None
    except Exception as e:
        print(f"Erro ao verificar acesso do usuário {user_id} ao agente {agent_id}: {e}")
        return False

def ensure_default_permissions(db: Session):
    """Cria as permissões padrão se não existirem"""
    try:
        # Permissão de administrador
        if not get_permission_by_name(db, "admin"):
            create_permission(db, "admin", "Acesso total ao sistema")
        
        # Permissão específica para agente 1116 (Kali Vitória)
        if not get_permission_by_name(db, "agent_1116"):
            create_permission(db, "agent_1116", "Acesso aos dados do agente Kali Vitória (ID: 1116)")
        
        return True
    except Exception as e:
        print(f"Erro ao criar permissões padrão: {e}")
        return False

SQL_GET_USER_BY_ID = text("""
SELECT 
    id,
    username,
    password_hash,
    full_name,
    active
FROM users 
WHERE id = :user_id
LIMIT 1;
""")

def get_user_by_id(db: Session, user_id: int) -> Optional[Dict[str, Any]]:
    """Busca um usuário pelo ID"""
    try:
        result = db.execute(SQL_GET_USER_BY_ID, {"user_id": user_id})
        row = result.mappings().first()
        if row:
            return {
                "id": row.id,
                "username": row.username,
                "password_hash": row.password_hash,
                "full_name": row.full_name,
                "active": row.active
            }
        return None
    except Exception as e:
        print(f"Erro ao buscar usuário por ID {user_id}: {e}")
        return None

def check_user_has_permission(db: Session, user_id: int, permission_id: int) -> bool:
    """Verifica se o usuário já tem uma permissão específica"""
    try:
        SQL_CHECK_USER_PERMISSION = text("""
            SELECT COUNT(*) as count
            FROM user_permissions up
            WHERE up.user_id = :user_id AND up.permission_id = :permission_id
        """)
        
        result = db.execute(SQL_CHECK_USER_PERMISSION, {
            "user_id": user_id,
            "permission_id": permission_id
        })
        count = result.scalar()
        return count > 0
        
    except Exception as e:
        print(f"Erro ao verificar permissão do usuário: {e}")
        return False
