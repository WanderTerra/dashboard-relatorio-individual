from fastapi import FastAPI, Depends, HTTPException, Query, Path, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import text
from dotenv import load_dotenv
from datetime import date
import os
import logging
import time
import requests
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()

# Import local modules
from .database import get_db
from .routers.auth import router as auth_router
from .models import ensure_users_table_exists, create_user, ensure_default_permissions
from .security import get_password_hash, verify_token
from .permissions import verify_admin_access
from .permissions import verify_agent_access, verify_admin_access

# Create FastAPI app
app = FastAPI(title="Dashboard API", description="API com autenticação JWT", version="1.0.0")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=os.getenv("CORS_ORIGINS", "http://localhost:5173").split(","),
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["*"],
)

# Add request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = time.time()
    logger.info(f"🌐 INCOMING REQUEST: {request.method} {request.url.path}")
    logger.info(f"📋 Headers: {dict(request.headers)}")
    
    response = await call_next(request)
    
    process_time = time.time() - start_time
    logger.info(f"✅ RESPONSE: {response.status_code} - Time: {process_time:.4f}s")
    return response

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Import the SQL queries
from .models import (
    SQL_KPI_AVG, SQL_KPI_QTD, SQL_KPI_PIOR_ITEM, SQL_TREND_GLOBAL,
    SQL_AGENTS_RANK, SQL_AGENT_SUMMARY, SQL_AGENT_CRITERIA_RADAR,
    SQL_AGENT_TREND, SQL_AGENT_ITEMS_TREND, SQL_AGENT_CALLS,
    SQL_CALL_ITEMS, SQL_CALL_TRANSCRIPTION, SQL_AGENT_WORST_ITEM
)

# Pydantic models for requests
class ItemUpdate(BaseModel):
    resultado: str
    descricao: str | None = None
    categoria: str | None = None

class ItemUpdateRequest(BaseModel):
    categoria: str
    resultado: str
    descricao: str | None = None

def filters(start: date, end: date, carteira: str | None):
    return {"start": start, "end": end, "carteira": carteira}

def recalcular_pontuacao_avaliacao(avaliacao_id: int, db: Session):
    """
    Recalcula a pontuação final de uma avaliação baseando-se nos itens atuais.
    Utiliza a mesma lógica do transcrever_audios.py:
    pontuacao = (total_conforme / total_validos * 100) se total_validos > 0, senão 0
    onde total_validos = itens que não são "NAO SE APLICA"
    """
    try:
        logger.info(f"Recalculando pontuação para avaliação {avaliacao_id}")
        
        # Buscar todos os itens da avaliação
        itens_stmt = text("""
            SELECT resultado FROM itens_avaliados 
            WHERE avaliacao_id = :avaliacao_id
        """)
        itens = db.execute(itens_stmt, {"avaliacao_id": avaliacao_id}).fetchall()
        
        if not itens:
            logger.warning(f"Nenhum item encontrado para avaliação {avaliacao_id}")
            return 0
        
        # Calcular pontuação seguindo a lógica do transcrever_audios.py
        total_validos = 0
        total_conforme = 0
        
        for item in itens:
            resultado = item[0]  # item[0] é a coluna 'resultado'
            if resultado != 'NAO SE APLICA':
                total_validos += 1
                if resultado == 'CONFORME':
                    total_conforme += 1
        
        # Calcular pontuação final
        pontuacao = (total_conforme / total_validos * 100) if total_validos > 0 else 0
        
        # Determinar status da avaliação
        status_avaliacao = 'APROVADA' if pontuacao >= 70 else 'REPROVADA'
        
        logger.info(f"Avaliação {avaliacao_id}: {total_conforme}/{total_validos} = {pontuacao:.2f}% ({status_avaliacao})")
        
        # Atualizar a pontuação na tabela avaliacoes
        update_stmt = text("""
            UPDATE avaliacoes 
            SET pontuacao = :pontuacao, status_avaliacao = :status_avaliacao
            WHERE id = :avaliacao_id
        """)
        
        result = db.execute(update_stmt, {
            "avaliacao_id": avaliacao_id,
            "pontuacao": round(pontuacao, 2),
            "status_avaliacao": status_avaliacao
        })
        
        if result.rowcount == 0:
            logger.warning(f"Nenhuma avaliação encontrada com ID {avaliacao_id}")
            return pontuacao
        
        logger.info(f"Pontuação da avaliação {avaliacao_id} atualizada para {pontuacao:.2f}%")
        return pontuacao
        
    except Exception as e:
        logger.error(f"Erro ao recalcular pontuação da avaliação {avaliacao_id}: {str(e)}", exc_info=True)
        raise e

# =============================================================================
# DATA ENDPOINTS FOR DASHBOARD
# =============================================================================

@app.get("/kpis")
def kpis(
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Endpoint /kpis chamado com start={start}, end={end}, carteira={carteira}")
        params = filters(start, end, carteira)
        logger.debug("Executando consulta SQL_KPI_AVG")
        k1 = db.execute(SQL_KPI_AVG, params).mappings().first() or {}
        logger.debug("Executando consulta SQL_KPI_QTD")
        k2 = db.execute(SQL_KPI_QTD, params).mappings().first() or {}
        logger.debug("Executando consulta SQL_KPI_PIOR_ITEM")
        pior = db.execute(SQL_KPI_PIOR_ITEM, params).mappings().first() or {}
        result = {"media_geral": k1.get("media_geral"), "total_ligacoes": k2.get("total_ligacoes"), "pior_item": pior}
        logger.info(f"Retornando resultado de /kpis: {result}")
        return result
    except Exception as e:
        logger.error(f"ERRO em /kpis: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/trend")
def trend(
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    try:
        logger.info(f"Endpoint /trend chamado com start={start}, end={end}, carteira={carteira}")
        params = filters(start, end, carteira)
        result = db.execute(SQL_TREND_GLOBAL, params).mappings().all() or []
        logger.info(f"Retornando {len(result)} resultados de /trend")
        return result
    except Exception as e:
        logger.error(f"ERRO em /trend: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro interno: {str(e)}")

@app.get("/agents")
def agents(
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_AGENTS_RANK, filters(start, end, carteira)).mappings().all()

@app.get("/agent/{agent_id}/summary")
def agent_summary(
    agent_id: str = Path(...), 
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    # Verificar permissões de acesso ao agente
    from .models import check_user_agent_access
    user_id = current_user.get("user_id") or current_user.get("id")
    
    if not user_id:
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
    
    logger.info(f"Acesso autorizado: usuário {current_user.get('username')} acessando dados do agente {agent_id}")
    
    row = db.execute(SQL_AGENT_SUMMARY, {"agent_id": agent_id, **filters(start, end, carteira)}).mappings().first()
    if not row:
        raise HTTPException(404, "Agente não encontrado")
    return row

@app.get("/agent/{agent_id}/criteria")
def agent_criteria(
    agent_id: str, 
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_AGENT_CRITERIA_RADAR, {"agent_id": agent_id, **filters(start, end, carteira)}).mappings().all()

@app.get("/agent/{agent_id}/trend")
def agent_trend(
    agent_id: str, 
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_AGENT_TREND, {"agent_id": agent_id, **filters(start, end, carteira)}).mappings().all()

@app.get("/agent/{agent_id}/items_trend")
def agent_items_trend(
    agent_id: str, 
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_AGENT_ITEMS_TREND, {"agent_id": agent_id, **filters(start, end, carteira)}).mappings().all()

@app.get("/agent/{agent_id}/calls")
def agent_calls(
    agent_id: str, 
    start: date = Query(...), 
    end: date = Query(...), 
    carteira: str | None = Query(None), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_AGENT_CALLS, {"agent_id": agent_id, **filters(start, end, carteira)}).mappings().all()

@app.get("/call/{avaliacao_id}/items")
def call_items(
    avaliacao_id: int, 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    return db.execute(SQL_CALL_ITEMS, {"avaliacao_id": avaliacao_id}).mappings().all()

@app.get("/call/{avaliacao_id}/transcription")
def call_transcription(
    avaliacao_id: int, 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    row = db.execute(SQL_CALL_TRANSCRIPTION, {"avaliacao_id": avaliacao_id}).mappings().first()
    return row or {}

@app.get("/call/{avaliacao_id}/caller")
def get_caller_info(
    avaliacao_id: int = Path(..., description="ID da avaliação"), 
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Busca informações do caller (número de telefone) baseado no ID da avaliação.
    """
    try:
        logger.info(f"Buscando caller info para avaliação {avaliacao_id}")
        
        # Executar query com JOIN entre avaliacoes e calls
        SQL_GET_CALLER_INFO = text("""
            SELECT 
                av.id as avaliacao_id,
                av.call_id,
                c.callerid
            FROM avaliacoes av
            LEFT JOIN calls c ON c.call_id = av.call_id
            WHERE av.id = :avaliacao_id
            LIMIT 1;
        """)
        
        result = db.execute(SQL_GET_CALLER_INFO, {"avaliacao_id": avaliacao_id})
        row = result.mappings().first()
        
        # Verificar se encontrou
        if not row:
            logger.warning(f"Avaliação {avaliacao_id} não encontrada")
            raise HTTPException(
                status_code=404,
                detail=f"Avaliação com ID {avaliacao_id} não encontrada"
            )
        
        # Preparar resposta
        caller_info = {
            "avaliacao_id": str(row.avaliacao_id),
            "call_id": str(row.call_id) if row.call_id else None,
            "callerid": row.callerid
        }
        
        logger.info(f"Caller info encontrado: {caller_info}")
        return caller_info
        
    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise
        
    except Exception as e:
        # Log e retorna erro 500
        logger.error(f"Erro ao buscar caller info para avaliação {avaliacao_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno do servidor ao buscar informações do caller: {str(e)}"
        )

@app.get("/call/{call_id}/audio")
def download_audio(
    call_id: str = Path(..., description="ID da chamada"),
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """
    Download do áudio da chamada baseado no call_id.
    Busca o áudio no servidor externo: https://portesmarinho.vonixcc.com.br/recordings/{call_id}
    """
    try:
        logger.info(f"Solicitação de download de áudio para call_id: {call_id}")
        
        # Verificar se o call_id existe na base de dados
        SQL_CHECK_CALL = text("""
            SELECT 
                c.call_id,
                c.callerid
            FROM calls c
            WHERE c.call_id = :call_id
            LIMIT 1;
        """)
        
        result = db.execute(SQL_CHECK_CALL, {"call_id": call_id})
        row = result.mappings().first()
        
        if not row:
            logger.warning(f"Call ID {call_id} não encontrado na base de dados")
            raise HTTPException(
                status_code=404,
                detail=f"Chamada não encontrada para call_id {call_id}"
            )
        
        # URL do arquivo de áudio no servidor externo
        audio_url = f"https://portesmarinho.vonixcc.com.br/recordings/{call_id}"
        logger.info(f"Fazendo download do áudio de: {audio_url}")
        
        # Fazer download do arquivo de áudio do servidor externo
        import requests
        from fastapi.responses import StreamingResponse
        
        try:
            # Fazer requisição para o servidor de áudio
            response = requests.get(audio_url, stream=True, timeout=30)
            response.raise_for_status()  # Levanta exceção se status não for 2xx
            
            # Determinar o tipo de conteúdo baseado na resposta
            content_type = response.headers.get('content-type', 'audio/wav')
            
            # Determinar extensão do arquivo
            if 'mp3' in content_type or 'mpeg' in content_type:
                file_extension = 'mp3'
                media_type = 'audio/mpeg'
            elif 'wav' in content_type:
                file_extension = 'wav'
                media_type = 'audio/wav'
            else:
                # Default para wav se não conseguir determinar
                file_extension = 'wav'
                media_type = 'audio/wav'
            
            logger.info(f"Áudio encontrado. Content-Type: {content_type}, Tamanho: {response.headers.get('content-length', 'desconhecido')} bytes")
            
            # Criar um stream a partir do conteúdo baixado
            def generate():
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        yield chunk
            
            # Retornar o arquivo como stream
            return StreamingResponse(
                generate(),
                media_type=media_type,
                headers={
                    "Content-Disposition": f"attachment; filename=audio_{call_id}.{file_extension}"
                }
            )
            
        except requests.exceptions.RequestException as req_error:
            logger.error(f"Erro ao fazer download do áudio de {audio_url}: {str(req_error)}")
            raise HTTPException(
                status_code=404,
                detail=f"Arquivo de áudio não encontrado no servidor externo para call_id {call_id}"
            )
        
    except HTTPException:
        # Re-raise HTTP exceptions (404)
        raise
        
    except Exception as e:
        # Log e retorna erro 500
        logger.error(f"Erro ao buscar áudio para call_id {call_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno do servidor ao buscar áudio: {str(e)}"
        )

@app.get("/agent/{agent_id}/worst_item")
def agent_worst_item(
    agent_id: str = Path(..., description="ID do agente"),
    start: date = Query(..., description="Data inicial (YYYY-MM-DD)"),
    end: date = Query(..., description="Data final (YYYY-MM-DD)"),
    carteira: str | None = Query(None, description="Carteira (opcional)"),
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db),
):
    params = {
        "agent_id": agent_id,
        "start": start,
        "end": end,
        "carteira": carteira
    }
    row = db.execute(SQL_AGENT_WORST_ITEM, params).mappings().first()
    if not row:
        raise HTTPException(
            status_code=404,
            detail="Nenhum item encontrado para esse agente e período"
        )
    return row

@app.put("/call/{avaliacao_id}/item/{categoria}")
async def update_call_item_put(
    avaliacao_id: int = Path(...),
    categoria: str = Path(...),
    item_update: ItemUpdate = ...,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Atualiza um item específico de uma avaliação pelo ID da avaliação e categoria do item"""
    try:
        logger.info(f"Atualizando item {categoria} da avaliação {avaliacao_id}: {item_update}")
        
        # Verificar se o item existe
        stmt = text("""
            SELECT id FROM itens_avaliados 
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        item_id = db.execute(stmt, {"avaliacao_id": avaliacao_id, "categoria": categoria}).scalar()
        
        if not item_id:
            raise HTTPException(status_code=404, detail=f"Item {categoria} não encontrado para a avaliação {avaliacao_id}")
        
        # Validar o resultado
        if item_update.resultado not in ["CONFORME", "NAO CONFORME", "NAO SE APLICA"]:
            raise HTTPException(status_code=400, detail="Resultado deve ser CONFORME, NAO CONFORME ou NAO SE APLICA")
        
        # Atualizar o item
        update_stmt = text("""
            UPDATE itens_avaliados 
            SET resultado = :resultado, descricao = :descricao
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        
        db.execute(
            update_stmt, 
            {
                "avaliacao_id": avaliacao_id, 
                "categoria": categoria,
                "resultado": item_update.resultado,
                "descricao": item_update.descricao or ""
            }
        )
        
        # Recalcular a pontuação da avaliação após a atualização do item
        recalcular_pontuacao_avaliacao(avaliacao_id, db)
        
        db.commit()
        
        # Retornar o item atualizado
        select_stmt = text("""
            SELECT * FROM itens_avaliados 
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        updated_item = db.execute(
            select_stmt, 
            {"avaliacao_id": avaliacao_id, "categoria": categoria}
        ).mappings().first()
        
        logger.info(f"Item atualizado com sucesso: {updated_item}")
        return updated_item
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar item: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar item: {str(e)}")

@app.post("/call/{avaliacao_id}/items")
async def update_call_item_post(
    avaliacao_id: int = Path(...),
    item_update: ItemUpdateRequest = ...,
    current_user: dict = Depends(verify_token),
    db: Session = Depends(get_db)
):
    """Endpoint alternativo para atualizar um item de avaliação usando POST"""
    try:
        logger.info(f"Atualizando item via POST para avaliação {avaliacao_id}: {item_update}")
        
        # Verificar se o item existe
        stmt = text("""
            SELECT id FROM itens_avaliados 
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        item_id = db.execute(stmt, {"avaliacao_id": avaliacao_id, "categoria": item_update.categoria}).scalar()
        
        if not item_id:
            raise HTTPException(status_code=404, detail=f"Item {item_update.categoria} não encontrado para a avaliação {avaliacao_id}")
        
        # Validar o resultado
        if item_update.resultado not in ["CONFORME", "NAO CONFORME", "NAO SE APLICA"]:
            raise HTTPException(status_code=400, detail="Resultado deve ser CONFORME, NAO CONFORME ou NAO SE APLICA")
        
        # Atualizar o item
        update_stmt = text("""
            UPDATE itens_avaliados 
            SET resultado = :resultado, descricao = :descricao
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        
        db.execute(
            update_stmt, 
            {
                "avaliacao_id": avaliacao_id, 
                "categoria": item_update.categoria,
                "resultado": item_update.resultado,
                "descricao": item_update.descricao or ""
            }
        )
        
        # Recalcular a pontuação da avaliação após a atualização do item
        recalcular_pontuacao_avaliacao(avaliacao_id, db)
        
        db.commit()
        
        # Retornar o item atualizado
        select_stmt = text("""
            SELECT * FROM itens_avaliados 
            WHERE avaliacao_id = :avaliacao_id AND categoria = :categoria
        """)
        updated_item = db.execute(
            select_stmt, 
            {"avaliacao_id": avaliacao_id, "categoria": item_update.categoria}
        ).mappings().first()
        
        logger.info(f"Item atualizado com sucesso via POST: {updated_item}")
        return updated_item
    except Exception as e:
        db.rollback()
        logger.error(f"Erro ao atualizar item via POST: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao atualizar item: {str(e)}")

# =============================================================================
# PERMISSIONS MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/admin/assign-permission")
async def assign_permission(
    user_id: int,
    permission_name: str,
    current_user: dict = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Atribuir permissão a um usuário (apenas para administradores)"""
    try:
        from .models import get_permission_by_name, assign_permission_to_user, get_user_by_id
        
        # Verificar se o usuário existe
        target_user = get_user_by_id(db, user_id)
        if not target_user:
            raise HTTPException(
                status_code=404,
                detail=f"Usuário com ID {user_id} não encontrado"
            )
        
        # Verificar se a permissão existe
        permission = get_permission_by_name(db, permission_name)
        if not permission:
            raise HTTPException(
                status_code=404,
                detail=f"Permissão '{permission_name}' não encontrada"
            )
        
        # Atribuir permissão
        success = assign_permission_to_user(db, user_id, permission["id"])
        
        if not success:
            raise HTTPException(
                status_code=500,
                detail="Erro ao atribuir permissão"
            )
        
        logger.info(f"Admin {current_user.get('username')} atribuiu permissão '{permission_name}' ao usuário ID {user_id}")
        
        return {
            "message": f"Permissão '{permission_name}' atribuída com sucesso ao usuário {target_user['username']}",
            "user_id": user_id,
            "permission": permission_name
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao atribuir permissão: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno do servidor: {str(e)}"
        )

@app.get("/admin/users/{user_id}/permissions")
async def get_user_permissions_endpoint(
    user_id: int,
    current_user: dict = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """Listar permissões de um usuário (apenas para administradores)"""
    try:
        from .models import get_user_permissions, get_user_by_id
        
        # Verificar se o usuário existe
        target_user = get_user_by_id(db, user_id)
        if not target_user:
            raise HTTPException(
                status_code=404,
                detail=f"Usuário com ID {user_id} não encontrado"
            )
        
        permissions = get_user_permissions(db, user_id)
        
        return {
            "user_id": user_id,
            "username": target_user["username"],
            "permissions": permissions
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Erro ao buscar permissões: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro interno do servidor: {str(e)}"
        )

# =============================================================================
# AGENT PERMISSIONS MANAGEMENT ENDPOINTS
# =============================================================================

@app.post("/admin/grant-admin-permission")
async def grant_admin_permission(
    db: Session = Depends(get_db)
):
    """
    Endpoint temporário para dar permissão de admin ao admin.sistema
    (Deve ser removido após configuração inicial)
    """
    try:
        # Buscar usuário admin.sistema
        user_query = text("SELECT id FROM users WHERE username = 'admin.sistema'")
        admin_user_id = db.execute(user_query).scalar()
        
        if not admin_user_id:
            raise HTTPException(status_code=404, detail="Usuário admin.sistema não encontrado")
        
        # Buscar permissão admin
        perm_query = text("SELECT id FROM permissions WHERE name = 'admin'")
        admin_perm_id = db.execute(perm_query).scalar()
        
        if not admin_perm_id:
            raise HTTPException(status_code=404, detail="Permissão admin não encontrada")
        
        # Verificar se já tem a permissão
        check_query = text("""
            SELECT 1 FROM user_permissions 
            WHERE user_id = :user_id AND permission_id = :permission_id
        """)
        has_permission = db.execute(check_query, {
            "user_id": admin_user_id,
            "permission_id": admin_perm_id
        }).scalar()
        
        if has_permission:
            return {"message": "Admin já possui permissão de administrador"}
        
        # Atribuir permissão
        assign_query = text("""
            INSERT INTO user_permissions (user_id, permission_id) 
            VALUES (:user_id, :permission_id)
        """)
        db.execute(assign_query, {
            "user_id": admin_user_id,
            "permission_id": admin_perm_id
        })
        
        db.commit()
        
        logger.info("✅ Permissão de admin atribuída ao admin.sistema")
        return {"message": "Permissão de admin atribuída com sucesso ao admin.sistema"}
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao atribuir permissão de admin: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/admin/setup-agent-permissions")
async def setup_agent_permissions(
    current_user: dict = Depends(verify_admin_access),
    db: Session = Depends(get_db)
):
    """
    Cria permissões individuais para cada agente e atribui ao usuário correspondente.
    Este endpoint deve ser executado pelo administrador para configurar o sistema.
    """
    try:
        logger.info("🔧 Iniciando configuração de permissões de agentes...")
        
        # Buscar todos os agentes únicos da base de dados
        agents_query = text("""
            SELECT DISTINCT agent_id, 
                   COALESCE(
                       (SELECT name FROM agents WHERE id = agent_id LIMIT 1),
                       CONCAT('Agente ', agent_id)
                   ) as agent_name
            FROM avaliacoes 
            WHERE agent_id IS NOT NULL 
            ORDER BY agent_id
        """)
        
        agents = db.execute(agents_query).fetchall()
        logger.info(f"📊 Encontrados {len(agents)} agentes únicos")
        
        created_permissions = 0
        created_users = 0
        assigned_permissions = 0
        
        for agent in agents:
            agent_id = str(agent.agent_id)
            agent_name = agent.agent_name
            
            # 1. Criar permissão para este agente (se não existir)
            permission_name = f"agent_{agent_id}"
            permission_desc = f"Acesso aos dados do agente {agent_name} (ID: {agent_id})"
            
            check_perm = text("SELECT id FROM permissions WHERE name = :name")
            existing_perm = db.execute(check_perm, {"name": permission_name}).scalar()
            
            if not existing_perm:
                create_perm = text("""
                    INSERT INTO permissions (name, description) 
                    VALUES (:name, :description)
                """)
                db.execute(create_perm, {
                    "name": permission_name,
                    "description": permission_desc
                })
                created_permissions += 1
                logger.info(f"✅ Permissão criada: {permission_name}")
            
            # 2. Criar usuário para este agente (se não existir)
            username = f"agent.{agent_id}"
            
            check_user = text("SELECT id FROM users WHERE username = :username")
            existing_user = db.execute(check_user, {"username": username}).scalar()
            
            if not existing_user:
                # Criar usuário
                password_hash = get_password_hash("Temp@2025")
                create_user_sql = text("""
                    INSERT INTO users (username, password_hash, full_name, active) 
                    VALUES (:username, :password_hash, :full_name, :active)
                """)
                db.execute(create_user_sql, {
                    "username": username,
                    "password_hash": password_hash,
                    "full_name": agent_name,
                    "active": True
                })
                created_users += 1
                logger.info(f"👤 Usuário criado: {username} ({agent_name})")
                
                # Buscar o ID do usuário recém-criado
                user_id = db.execute(check_user, {"username": username}).scalar()
            else:
                user_id = existing_user
            
            # 3. Atribuir permissão ao usuário (se não já atribuída)
            perm_id = db.execute(check_perm, {"name": permission_name}).scalar()
            
            check_assignment = text("""
                SELECT 1 FROM user_permissions 
                WHERE user_id = :user_id AND permission_id = :permission_id
            """)
            existing_assignment = db.execute(check_assignment, {
                "user_id": user_id,
                "permission_id": perm_id
            }).scalar()
            
            if not existing_assignment:
                assign_perm = text("""
                    INSERT INTO user_permissions (user_id, permission_id) 
                    VALUES (:user_id, :permission_id)
                """)
                db.execute(assign_perm, {
                    "user_id": user_id,
                    "permission_id": perm_id
                })
                assigned_permissions += 1
                logger.info(f"🔗 Permissão {permission_name} atribuída ao usuário {username}")
        
        # Commit todas as mudanças
        db.commit()
        
        result = {
            "message": "Configuração de permissões de agentes concluída com sucesso!",
            "summary": {
                "total_agents": len(agents),
                "permissions_created": created_permissions,
                "users_created": created_users,
                "permissions_assigned": assigned_permissions
            }
        }
        
        logger.info(f"🎉 Configuração concluída: {result['summary']}")
        return result
        
    except Exception as e:
        db.rollback()
        logger.error(f"❌ Erro ao configurar permissões de agentes: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao configurar permissões: {str(e)}"
        )
# Add a simple test route
@app.get("/test")
async def test_route():
    logger.info("🧪 Test route called!")
    return {"message": "Backend is working!", "status": "ok"}

@app.post("/auth/test-login")
async def test_login():
    logger.info("🔐 Test login route called!")
    return {"message": "Auth route is accessible", "status": "ok"}

@app.on_event("startup")
async def startup_event():
    """Inicialização da aplicação"""
    logger.info("Iniciando aplicação...")
    
    # Ensure users table exists
    db = next(get_db())
    try:
        # Create users table if it doesn't exist
        ensure_users_table_exists(db)
        logger.info("Tabela de usuários verificada/criada com sucesso")
        
        # Create default permissions
        ensure_default_permissions(db)
        logger.info("Permissões padrão verificadas/criadas com sucesso")
        
        # Create default admin user if no users exist
        from .models import get_user_by_username
        admin_user = get_user_by_username(db, "admin.sistema")
        
        if not admin_user:
            password_hash = get_password_hash("Temp@2025")
            success = create_user(
                db=db,
                username="admin.sistema",
                password_hash=password_hash,
                full_name="Administrador do Sistema",
                active=True
            )
            if success:
                logger.info("Usuário admin padrão criado: admin.sistema / Temp@2025")
            else:
                logger.error("Erro ao criar usuário admin padrão")
        else:
            logger.info("Usuário admin já existe")
        
        # Ensure admin user has admin permission
        admin_user = get_user_by_username(db, "admin.sistema")
        if admin_user:
            from .models import (
                get_permission_by_name, 
                assign_permission_to_user,
                check_user_has_permission
            )
            
            admin_permission = get_permission_by_name(db, "admin")
            if admin_permission and not check_user_has_permission(db, admin_user["id"], admin_permission["id"]):
                success = assign_permission_to_user(db, admin_user["id"], admin_permission["id"])
                if success:
                    logger.info("Permissão admin atribuída ao usuário admin.sistema")
                else:
                    logger.error("Erro ao atribuir permissão admin")
        
        # Create Kali Vitória user for testing permissions
        kali_user = get_user_by_username(db, "kali.vitoria")
        if not kali_user:
            password_hash = get_password_hash("Temp@2025")
            success = create_user(
                db=db,
                username="kali.vitoria",
                password_hash=password_hash,
                full_name="Kali Vitória",
                active=True
            )
            if success:
                logger.info("Usuário Kali Vitória criado: kali.vitoria / Temp@2025")
                
                # Assign agent_1116 permission to Kali
                from .models import (
                    get_permission_by_name, 
                    assign_permission_to_user,
                    get_user_by_username as get_user_full
                )
                
                # Get the user ID and permission ID
                kali_user_full = get_user_full(db, "kali.vitoria")
                agent_permission = get_permission_by_name(db, "agent_1116")
                
                if kali_user_full and agent_permission:
                    success = assign_permission_to_user(db, kali_user_full["id"], agent_permission["id"])
                    if success:
                        logger.info("Permissão agent_1116 atribuída a Kali Vitória")
                    else:
                        logger.error("Erro ao atribuir permissão a Kali Vitória")
                else:
                    logger.warning("Não foi possível encontrar usuário ou permissão para atribuição")
            else:
                logger.error("Erro ao criar usuário Kali Vitória")
        else:
            logger.info("Usuário Kali Vitória já existe")
            
    except Exception as e:
        logger.error(f"Erro na inicialização: {e}")
    finally:
        db.close()

@app.get("/")
def read_root():
    """Endpoint raiz"""
    return {
        "message": "Dashboard API com Autenticação JWT",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection
        result = db.execute(text("SELECT 1")).scalar()
        return {
            "status": "healthy",
            "database": "connected",
            "result": result
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

# Sample protected endpoint
@app.get("/protected")
def protected_endpoint(current_user: dict = Depends(verify_token)):
    """Exemplo de endpoint protegido"""
    return {
        "message": "Acesso autorizado",
        "user": current_user["username"]
    }

@app.post("/admin/reset-password")
async def reset_admin_password(db: Session = Depends(get_db)):
    """Temporário: Reset da senha do admin para resolver issue do bcrypt"""
    try:
        from .models import update_user_password
        new_password = "Nova@2025"
        new_hash = get_password_hash(new_password)
        
        success = update_user_password(db, "admin.sistema", new_hash)
        if success:
            return {
                "message": "Password reset successful",
                "username": "admin.sistema",
                "new_password": new_password
            }
        else:
            raise HTTPException(status_code=500, detail="Failed to update password")
    except Exception as e:
        logger.error(f"Error resetting admin password: {e}")
        raise HTTPException(status_code=500, detail=str(e))
