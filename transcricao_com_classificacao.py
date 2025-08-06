from fastapi import APIRouter, UploadFile, File, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.permissions import verify_token
import os, json, time
from dotenv import load_dotenv
import requests
from typing import Optional, Dict, List, Any

router = APIRouter(prefix="/transcricao", tags=["transcricao"])

# Configurações (mantidas como estavam)
load_dotenv()
API_KEY = os.getenv("ELEVENLABS_API_KEY")
MODEL_ID = "scribe_v1"
N_SPK = 2  # dois locutores nas ligações

class SpeakerClassifier:
    """
    Classificador para identificar Agente vs Cliente baseado na diarização do Scribe
    """
    
    def __init__(self):
        # Indicadores de AGENTE (peso 3x - aumentado)
        self.agent_indicators = [
            "bom dia", "boa tarde", "boa noite", "como posso ajudar",
            "posso te ajudar", "em que posso ajudar", "obrigado por entrar em contato",
            "agradeço o contato", "empresa", "seguro", "cobertura", "apólice",
            "sinistro", "indenização", "benefício", "muito obrigado", "agradeço",
            "fico à disposição", "qualquer dúvida", "mais alguma coisa",
            "protocolo", "abertura", "solicitação", "documentação",
            "prazo", "sistema", "cadastro", "verificar", "consultar",
            # Novos indicadores importantes:
            "falo com", "representante", "empresa", "tecnologias", 
            "atendimento", "central", "setor", "departamento",
            "confirmar", "verificar seus dados", "cpf", "rg",
            "endereço", "telefone para contato", "posso confirmar"
        ]
        
        # Indicadores de CLIENTE (peso 1x)
        self.client_indicators = [
            "quero saber", "preciso de", "gostaria de", "tenho uma dúvida",
            "não entendi", "pode me explicar", "quanto custa", "qual o valor",
            "como faço para", "preciso fazer", "quero cancelar", "quero contratar",
            "meu nome é", "eu sou", "tá bem", "entendi", "ok", "certo",
            "minha situação", "meu caso", "aconteceu comigo", "estou precisando",
            "queria fazer", "me ajuda", "socorro", "urgente", "problema",
            "isso mesmo", "correto", "é isso aí"
        ]

    def process_transcription(self, scribe_response: Dict) -> Dict:
        """Processa resposta do Scribe e adiciona classificações"""
        words = scribe_response.get('words', [])
        

        # Análise de falantes
        speaker_stats = {}
        
        for word_data in words:
            if word_data.get('type') != 'word':
                continue
                
            speaker_id = word_data.get('speaker_id', 'unknown')
            text = word_data.get('text', '').lower().strip()
            
            if not text:
                continue
                
            if speaker_id not in speaker_stats:
                speaker_stats[speaker_id] = {
                    'total_words': 0,
                    'agent_score': 0,
                    'client_score': 0,
                    'start_time': word_data.get('start', 0)
                }
            
            stats = speaker_stats[speaker_id]
            stats['total_words'] += 1
            
            # Pontuação por indicadores
            for indicator in self.agent_indicators:
                if indicator in text:
                    stats['agent_score'] += 3  # Peso aumentado para agente
            
            for indicator in self.client_indicators:
                if indicator in text:
                    stats['client_score'] += 1
        
        # Classificação simples
        classifications = {}
        
        if len(speaker_stats) == 1:
            # Apenas um falante = agente
            speaker_id = list(speaker_stats.keys())[0]
            classifications[speaker_id] = 'agente'
        else:
            # Múltiplos falantes
            speaker_list = list(speaker_stats.items())
            
            # Quem fala primeiro geralmente é agente
            first_speaker = min(speaker_list, key=lambda x: x[1]['start_time'])[0]
            
            # Maior pontuação de agente
            agent_scores = [(id, stats['agent_score']) for id, stats in speaker_list]
            best_agent_by_score = max(agent_scores, key=lambda x: x[1])[0]
            
            # Mais palavras (agentes falam mais)
            word_counts = [(id, stats['total_words']) for id, stats in speaker_list]
            most_talkative = max(word_counts, key=lambda x: x[1])[0]
            
            # Combinação de heurísticas
            agent_candidates = [first_speaker, best_agent_by_score, most_talkative]
            agent_candidate = max(set(agent_candidates), key=agent_candidates.count)
            
            classifications[agent_candidate] = 'agente'
            
            for speaker_id, _ in speaker_list:
                if speaker_id != agent_candidate:
                    classifications[speaker_id] = 'cliente'
        
        # Adiciona classificações às palavras
        enhanced_words = []
        for word_data in words:
            enhanced_word = word_data.copy()
            speaker_id = word_data.get('speaker_id')
            enhanced_word['speaker_role'] = classifications.get(speaker_id, 'unknown')
            enhanced_words.append(enhanced_word)
        
        # Cria resumo por papel com espaços corretos
        def build_text_for_role(role_name):
            """Constrói texto para um papel específico com espaçamento correto"""
            words_for_role = []
            
            for word_data in enhanced_words:
                if word_data.get('speaker_role') == role_name:
                    word_type = word_data.get('type', '')
                    text = word_data.get('text', '')
                    
                    if word_type == 'word':
                        words_for_role.append(text)
                    elif word_type in ['spacing', 'punctuation']:
                        # Se é espaço/pontuação, adiciona ao último elemento se existir
                        if words_for_role:
                            words_for_role[-1] += text
            
            # Se não tem espaços adequados, junta com espaços
            if words_for_role:
                result = words_for_role[0]
                for word in words_for_role[1:]:
                    # Se a palavra não começa com pontuação, adiciona espaço
                    if not word.startswith((',', '.', '!', '?', ';', ':')):
                        result += ' '
                    result += word
                return result
            return ''
        
        role_summary = {
            'agente_text': build_text_for_role('agente'),
            'cliente_text': build_text_for_role('cliente'),
            'total_agente_words': len([w for w in enhanced_words if w.get('speaker_role') == 'agente' and w.get('type') == 'word']),
            'total_cliente_words': len([w for w in enhanced_words if w.get('speaker_role') == 'cliente' and w.get('type') == 'word'])
        }
        
        return {
            **scribe_response,
            'words': enhanced_words,
            'speaker_classifications': classifications,
            'role_summary': role_summary
        }


@router.post("/upload")
async def transcrever_audio_upload(
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Endpoint para transcrever um arquivo de áudio (upload) de forma síncrona.
    Envia direto para ElevenLabs com classificação agente/cliente.
    """
    try:
        print(f"🎙️ Iniciando transcrição com classificação: {arquivo.filename}")
        print(f"Tamanho do arquivo: {arquivo.size} bytes")
        
        # Lê o conteúdo do arquivo
        conteudo = await arquivo.read()
        
        # Envia direto para ElevenLabs (mantendo sua implementação original)
        print("Enviando para ElevenLabs...")
        resp = requests.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": API_KEY},
            files={"file": (arquivo.filename, conteudo, arquivo.content_type)},  # Mantido como estava
            data={
                "model_id": MODEL_ID,
                "diarize": True,
                "num_speakers": N_SPK,
                "tag_audio_events": True,
                "timestamps_granularity": "word",  # Mantido como estava
                "language_code": "por"  # Mantido como estava
            },
            timeout=300  # 5 minutos de timeout
        )
        
        resp.raise_for_status()
        transcricao_data = resp.json()
        print("Transcrição recebida com sucesso!")
        
        # ✅ NOVA FUNCIONALIDADE: Adiciona classificação agente/cliente
        classifier = SpeakerClassifier()
        enhanced_transcription = classifier.process_transcription(transcricao_data)
        
        print(f"🔍 Classificação automática: {enhanced_transcription.get('speaker_classifications', {})}")
        
        return {
            "mensagem": "Transcrição com classificação realizada com sucesso",
            "arquivo": arquivo.filename,
            "palavras": len(enhanced_transcription.get("words", [])),
            "total_speakers": len(enhanced_transcription.get('speaker_classifications', {})),
            "transcricao": enhanced_transcription  # ✅ Agora com classificações
        }
        
    except requests.exceptions.RequestException as e:
        print(f"Erro na API ElevenLabs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na transcrição: {str(e)}")
    except Exception as e:
        print(f"Erro geral: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{avaliacao_id}")
async def transcrever_audio(
    avaliacao_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Transcreve áudio direto para ElevenLabs com classificação e salva na tabela transcricoes.
    """
    try:
        # Verifica se avaliação existe (mantido como estava)
        avaliacao = db.execute(
            text("SELECT id FROM avaliacoes WHERE id = :id"),
            {"id": avaliacao_id}
        ).first()
        
        if not avaliacao:
            raise HTTPException(status_code=404, detail="Avaliação não encontrada")

        # Verifica se já existe transcrição (mantido como estava)
        transcricao_existente = db.execute(
            text("SELECT id FROM transcricoes WHERE avaliacao_id = :avaliacao_id"),
            {"avaliacao_id": avaliacao_id}
        ).first()
        
        if transcricao_existente:
            raise HTTPException(status_code=400, detail="Já existe transcrição para esta avaliação")

        print(f"🎙️ Iniciando transcrição com classificação para avaliação {avaliacao_id}: {arquivo.filename}")
        
        # Lê o conteúdo do arquivo
        conteudo = await arquivo.read()
        
        # Envia direto para ElevenLabs (mantendo sua implementação original)
        print("Enviando para ElevenLabs...")
        resp = requests.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": API_KEY},
            files={"file": (arquivo.filename, conteudo, arquivo.content_type)},  # Mantido como estava
            data={
                "model_id": MODEL_ID,
                "diarize": True,
                "num_speakers": N_SPK,
                "tag_audio_events": True,
                "timestamps_granularity": "word",  # Mantido como estava
                "language_code": "por"  # Mantido como estava
            },
            timeout=300
        )
        
        resp.raise_for_status()
        transcricao_data = resp.json()
        print("Transcrição recebida com sucesso!")

        # ✅ NOVA FUNCIONALIDADE: Adiciona classificação agente/cliente
        classifier = SpeakerClassifier()
        enhanced_transcription = classifier.process_transcription(transcricao_data)
        
        print(f"🔍 Classificação automática: {enhanced_transcription.get('speaker_classifications', {})}")

        # Salva no banco (mantido como estava, mas agora com classificações)
        db.execute(
            text("""
                INSERT INTO transcricoes (avaliacao_id, conteudo, criado_em)
                VALUES (:avaliacao_id, :conteudo, CURRENT_TIMESTAMP)
            """),
            {
                "avaliacao_id": avaliacao_id,
                "conteudo": json.dumps(enhanced_transcription, ensure_ascii=False)  # ✅ Salva com classificações
            }
        )
        db.commit()

        return {
            "avaliacao_id": avaliacao_id,
            "mensagem": "Transcrição com classificação realizada e salva com sucesso",
            "palavras": len(enhanced_transcription.get("words", [])),
            "total_speakers": len(enhanced_transcription.get('speaker_classifications', {})),
            "transcricao": enhanced_transcription  # ✅ Agora com classificações
        }

    except requests.exceptions.RequestException as e:
        db.rollback()
        print(f"Erro na API ElevenLabs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Erro na transcrição: {str(e)}")
    except Exception as e:
        db.rollback()
        print(f"Erro geral: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{avaliacao_id}")
async def buscar_transcricao(
    avaliacao_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retorna a transcrição com diarização e classificações de uma avaliação
    """
    result = db.execute(
        text("SELECT id, conteudo, criado_em FROM transcricoes WHERE avaliacao_id = :avaliacao_id"),
        {"avaliacao_id": avaliacao_id}
    ).first()

    if not result:
        raise HTTPException(status_code=404, detail="Transcrição não encontrada")

    # Parse do JSON armazenado
    transcricao = json.loads(result[1])

    return {
        "id": result[0],
        "avaliacao_id": avaliacao_id,
        "transcricao": transcricao,  # Inclui texto, words com timestamps, speakers e roles
        "speaker_classifications": transcricao.get('speaker_classifications', {}),  # ✅ Retorna classificações
        "role_summary": transcricao.get('role_summary', {}),  # ✅ Retorna resumo por papel
        "criado_em": result[2]
    }