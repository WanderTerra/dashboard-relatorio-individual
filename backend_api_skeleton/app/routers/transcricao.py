from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database import get_db
from app.permissions import verify_token
from pydub import AudioSegment
from io import BytesIO
import os, json, time
import math
from dotenv import load_dotenv
import requests
from fastapi.responses import FileResponse
from pathlib import Path
from typing import Optional

# Configurar caminho do FFmpeg para Windows
AudioSegment.converter = r"C:\ffmpeg\ffmpeg-7.1.1-essentials_build\bin\ffmpeg.exe"
AudioSegment.ffprobe = r"C:\ffmpeg\ffmpeg-7.1.1-essentials_build\bin\ffprobe.exe"

router = APIRouter(prefix="/transcricao", tags=["transcricao"])

# Configurações
load_dotenv()
API_KEY = os.getenv("ELEVENLABS_API_KEY")
CHUNK_SEC = 480  # 8 min máx. com diarize=True
MODEL_ID = "scribe_v1"
N_SPK = 2  # dois locutores nas ligações

# Diretório para salvar uploads
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

def chunk_audio(audio_content: bytes):
    """Divide o áudio em chunks de 480s"""
    # Carrega áudio do conteúdo em bytes
    print(f"Tentando carregar áudio, tamanho: {len(audio_content)} bytes")
    try:
        audio = AudioSegment.from_file(BytesIO(audio_content))
        print(f"Áudio carregado com sucesso, duração: {len(audio)/1000.0:.2f}s")
    except Exception as e:
        print(f"Erro ao carregar áudio: {str(e)}")
        raise
    
    dur_s = len(audio) / 1000.0
    chunks = []
    
    for i in range(math.ceil(dur_s / CHUNK_SEC)):
        start = i * CHUNK_SEC * 1000
        end = min((i + 1) * CHUNK_SEC * 1000, len(audio))
        chunk_audio = audio[start:end]
        buf = BytesIO()
        chunk_audio.export(buf, format="mp3")
        buf.seek(0)
        chunks.append((start / 1000.0, buf))
    
    return chunks

def transcribe_chunk(buf):
    """Transcreve um chunk usando ElevenLabs"""
    try:
        resp = requests.post(
            "https://api.elevenlabs.io/v1/speech-to-text",
            headers={"xi-api-key": API_KEY},
            files={"file": ("chunk.mp3", buf, "audio/mpeg")},
            data={
                "model_id": MODEL_ID,
                "diarize": True,
                "num_speakers": N_SPK,
                "tag_audio_events": True,
                "timestamps_granularity": "word",
                "language_code": "por"
            },
            timeout=600
        )
        resp.raise_for_status()
        return resp.json()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erro na transcrição: {str(e)}")

def merge_transcripts(parts):
    """Une as transcrições dos chunks"""
    full_words, full_text = [], []
    for offset, js in parts:
        for w in js["words"]:
            w["start"] += offset
            w["end"] += offset
            full_words.append(w)
        full_text.append(js["text"])
    return {
        "text": " ".join(full_text),
        "words": full_words
    }

@router.post("/upload")
async def transcrever_audio_upload(
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Endpoint para transcrever um arquivo de áudio (upload) de forma síncrona.
    A transcrição é feita e retornada na resposta.
    """
    try:
        print(f"Iniciando transcrição do arquivo: {arquivo.filename}")
        # Lê o conteúdo do arquivo diretamente da memória
        conteudo = await arquivo.read()
        print(f"Arquivo lido, tamanho: {len(conteudo)} bytes")

        print("Iniciando divisão em chunks...")
        # Divide em chunks e transcreve
        chunks = chunk_audio(conteudo)
        print(f"Chunks criados: {len(chunks)}")
        
        results = []
        for i, (offset, buf) in enumerate(chunks):
            print(f"Transcrevendo chunk {i+1}/{len(chunks)}")
            js = transcribe_chunk(buf)
            print(f"Chunk {i+1} transcrito com sucesso")
            results.append((offset, js))
            time.sleep(1)  # respeita rate-limit

        print("Unindo resultados...")
        # Une os resultados
        transcricao_final = merge_transcripts(results)
        print("Transcrição finalizada com sucesso")

        return {
            "mensagem": "Transcrição realizada com sucesso",
            "arquivo": arquivo.filename,
            "chunks_processados": len(chunks),
            "duracao_total": sum(offset for offset, _ in chunks),
            "palavras": len(transcricao_final["words"]),
            "transcricao": transcricao_final
        }
    except Exception as e:
        print(f"Erro detalhado: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/{avaliacao_id}")
async def transcrever_audio(
    avaliacao_id: int,
    arquivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Transcreve áudio em chunks e salva na tabela transcricoes.
    Inclui diarização (identificação de falantes).
    """
    try:
        # Verifica se avaliação existe
        avaliacao = db.execute(
            text("SELECT id FROM avaliacoes WHERE id = :id"),
            {"id": avaliacao_id}
        ).first()
        
        if not avaliacao:
            raise HTTPException(status_code=404, detail="Avaliação não encontrada")

        # Verifica se já existe transcrição
        transcricao_existente = db.execute(
            text("SELECT id FROM transcricoes WHERE avaliacao_id = :avaliacao_id"),
            {"avaliacao_id": avaliacao_id}
        ).first()
        
        if transcricao_existente:
            raise HTTPException(status_code=400, detail="Já existe transcrição para esta avaliação")

        # Lê o conteúdo do arquivo
        conteudo = await arquivo.read()

        # Divide em chunks e transcreve
        chunks = chunk_audio(conteudo)
        results = []
        
        for offset, buf in chunks:
            js = transcribe_chunk(buf)
            results.append((offset, js))
            time.sleep(1)  # respeita rate-limit

        # Une os resultados
        transcricao_final = merge_transcripts(results)

        # Salva no banco
        db.execute(
            text("""
                INSERT INTO transcricoes (avaliacao_id, conteudo, criado_em)
                VALUES (:avaliacao_id, :conteudo, CURRENT_TIMESTAMP)
            """),
            {
                "avaliacao_id": avaliacao_id,
                "conteudo": json.dumps(transcricao_final, ensure_ascii=False)  # Salva JSON completo
            }
        )
        db.commit()

        return {
            "avaliacao_id": avaliacao_id,
            "mensagem": "Transcrição realizada com sucesso",
            "chunks_processados": len(chunks),
            "duracao_total": sum(offset for offset, _ in chunks),
            "palavras": len(transcricao_final["words"])
        }

    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{avaliacao_id}")
async def buscar_transcricao(
    avaliacao_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(verify_token)
):
    """
    Retorna a transcrição com diarização de uma avaliação
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
        "transcricao": transcricao,  # Inclui texto e words com timestamps e speakers
        "criado_em": result[2]
    }
