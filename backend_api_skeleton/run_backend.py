import uvicorn
import os
import sys

# Adicionar o diretório atual ao path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

if __name__ == "__main__":
    # Inicializar banco de dados primeiro
    try:
        from init_db import init_database
        init_database()
        print("Banco de dados inicializado!")
    except Exception as e:
        print(f"Erro ao inicializar banco: {e}")
    
    # Executar o servidor
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    ) 