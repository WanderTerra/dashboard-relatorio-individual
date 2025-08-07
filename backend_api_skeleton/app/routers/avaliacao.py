from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.security import verify_admin_access
from typing import Dict, Any, List
from pydantic import BaseModel
import json
import os
import openai
from datetime import datetime

router = APIRouter(prefix="/avaliacao", tags=["avaliacao"])

# Configurar OpenAI
openai.api_key = os.getenv("OPENAI_API_KEY")
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

class AvaliacaoAutomaticaRequest(BaseModel):
    transcricao: str
    carteira_id: int
    call_id: str = None
    agent_id: str = None

class ItemAvaliado(BaseModel):
    criterio_id: int
    criterio_nome: str
    status: str  # "CONFORME", "NAO CONFORME", "NAO SE APLICA"
    observacao: str
    peso: float

class AvaliacaoAutomaticaResponse(BaseModel):
    id_chamada: str
    avaliador: str = "IA"
    falha_critica: bool
    itens: List[ItemAvaliado]
    pontuacao_total: float
    pontuacao_percentual: float
    status_avaliacao: str  # "APROVADA" ou "REPROVADA"

def criar_prompt_avaliacao(transcricao: str, criterios: List[Dict]) -> str:
    """Cria o prompt para a OpenAI baseado na transcrição e critérios"""
    
    criterios_texto = ""
    for i, criterio in enumerate(criterios, 1):
        criterios_texto += f"{i}. {criterio['nome']}\n"
        if criterio.get('descricao'):
            criterios_texto += f"   Descrição: {criterio['descricao']}\n"
        criterios_texto += "\n"
    
    prompt = f"""
Você é um especialista em avaliação de qualidade de atendimento telefônico. 

Analise a seguinte transcrição de uma chamada e avalie cada critério especificado.

TRANSCRIÇÃO DA CHAMADA:
{transcricao}

CRITÉRIOS A SEREM AVALIADOS:
{criterios_texto}

INSTRUÇÕES:
1. Para cada critério, determine se está: CONFORME, NAO CONFORME, ou NAO SE APLICA
2. Se um critério não se aplica ao contexto da chamada, marque como "NAO SE APLICA"
3. Seja rigoroso na avaliação, mas justo
4. Forneça uma observação breve e específica para cada critério
5. Se houver uma "Falha Crítica", isso deve resultar em pontuação zero

RESPONDA APENAS EM JSON NO SEGUINTE FORMATO:
{{
    "avaliacao": [
        {{
            "criterio_id": 1,
            "criterio_nome": "Nome do Critério",
            "status": "CONFORME|NAO CONFORME|NAO SE APLICA",
            "observacao": "Observação específica sobre o critério",
            "peso": 1.0
        }}
    ],
    "falha_critica": false,
    "observacoes_gerais": "Observações gerais sobre a chamada"
}}

IMPORTANTE: Responda APENAS o JSON, sem texto adicional.
"""
    return prompt

def redistribuir_pesos_e_pontuacao(itens: List[Dict]) -> Dict:
    """Redistribui pesos e calcula pontuação baseado na função fornecida"""
    
    # Separar itens válidos e não aplicáveis
    itens_validos = [item for item in itens if item['status'] != 'NAO SE APLICA']
    itens_nao_aplicaveis = [item for item in itens if item['status'] == 'NAO SE APLICA']
    
    if not itens_validos:
        return {
            'pontuacao_percentual': 0.0,
            'status_avaliacao': 'REPROVADA',
            'itens_redistribuidos': itens
        }
    
    # Calcular peso total dos itens válidos
    peso_total_validos = sum(item['peso'] for item in itens_validos)
    
    # Redistribuir pesos igualmente entre itens válidos
    peso_redistribuido = peso_total_validos / len(itens_validos)
    
    # Atualizar pesos dos itens válidos
    for item in itens_validos:
        item['peso'] = peso_redistribuido
    
    # Calcular pontuação
    itens_conformes = [item for item in itens_validos if item['status'] == 'CONFORME']
    peso_conformes = sum(item['peso'] for item in itens_conformes)
    
    pontuacao_percentual = (peso_conformes / peso_total_validos) * 100 if peso_total_validos > 0 else 0.0
    
    # Verificar falha crítica
    falha_critica = any(
        'falha crítica' in item['criterio_nome'].lower() and item['status'] == 'NAO CONFORME'
        for item in itens
    )
    
    if falha_critica:
        pontuacao_percentual = 0.0
    
    status_avaliacao = 'APROVADA' if pontuacao_percentual >= 70 else 'REPROVADA'
    
    return {
        'pontuacao_percentual': round(pontuacao_percentual, 2),
        'status_avaliacao': status_avaliacao,
        'itens_redistribuidos': itens,
        'falha_critica': falha_critica
    }

@router.post("/automatica", response_model=AvaliacaoAutomaticaResponse)
def avaliar_transcricao_automatica(
    request: AvaliacaoAutomaticaRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_admin_access)
):
    """Avalia automaticamente uma transcrição usando IA OpenAI"""
    try:
        # Verificar se a carteira existe
        carteira = db.execute(
            text("SELECT id, nome FROM carteiras WHERE id = :carteira_id"),
            {"carteira_id": request.carteira_id}
        ).fetchone()
        
        if not carteira:
            raise HTTPException(status_code=404, detail="Carteira não encontrada")
        
        # Buscar critérios da carteira
        criterios = db.execute(
            text("""
                SELECT c.id, c.nome, c.descricao, c.categoria, cc.peso_especifico
                FROM criterios c
                INNER JOIN carteira_criterios cc ON c.id = cc.criterio_id
                WHERE cc.carteira_id = :carteira_id AND c.ativo = 1
                ORDER BY cc.ordem, c.nome
            """),
            {"carteira_id": request.carteira_id}
        ).mappings().all()
        
        if not criterios:
            raise HTTPException(status_code=404, detail="Nenhum critério encontrado para esta carteira")
        
        # Verificar se a chave da OpenAI está configurada
        if not openai.api_key:
            raise HTTPException(status_code=500, detail="Chave da API OpenAI não configurada")
        
        # Criar prompt para a IA
        prompt = criar_prompt_avaliacao(request.transcricao, [dict(c) for c in criterios])
        
        # Chamar OpenAI
        try:
            response = openai.ChatCompletion.create(
                model=OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "Você é um especialista em avaliação de qualidade de atendimento telefônico."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.1,
                max_tokens=2000
            )
            
            # Extrair resposta da IA
            resposta_ia = response.choices[0].message.content.strip()
            
            # Tentar fazer parse do JSON
            try:
                dados_avaliacao = json.loads(resposta_ia)
            except json.JSONDecodeError:
                # Se falhar, tentar extrair JSON da resposta
                import re
                json_match = re.search(r'\{.*\}', resposta_ia, re.DOTALL)
                if json_match:
                    dados_avaliacao = json.loads(json_match.group())
                else:
                    raise Exception("Não foi possível extrair JSON da resposta da IA")
            
            # Processar itens da avaliação
            itens_avaliados = []
            for item_ia in dados_avaliacao.get('avaliacao', []):
                # Encontrar critério correspondente
                criterio = next((c for c in criterios if c['id'] == item_ia['criterio_id']), None)
                if criterio:
                    item = ItemAvaliado(
                        criterio_id=criterio['id'],
                        criterio_nome=criterio['nome'],
                        status=item_ia['status'],
                        observacao=item_ia.get('observacao', ''),
                        peso=criterio['peso_especifico'] or 1.0
                    )
                    itens_avaliados.append(item)
            
            # Redistribuir pesos e calcular pontuação
            resultado = redistribuir_pesos_e_pontuacao([item.dict() for item in itens_avaliados])
            
            # Atualizar itens com pesos redistribuídos
            for i, item in enumerate(itens_avaliados):
                item.peso = resultado['itens_redistribuidos'][i]['peso']
            
            return AvaliacaoAutomaticaResponse(
                id_chamada=request.call_id or f"chamada_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
                avaliador="IA OpenAI",
                falha_critica=resultado['falha_critica'],
                itens=itens_avaliados,
                pontuacao_total=sum(item.peso for item in itens_avaliados if item.status == 'CONFORME'),
                pontuacao_percentual=resultado['pontuacao_percentual'],
                status_avaliacao=resultado['status_avaliacao']
            )
            
        except Exception as e:
            # Log do erro para debug
            print(f"Erro na chamada da OpenAI: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Erro na avaliação da IA: {str(e)}")
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na avaliação automática: {str(e)}") 