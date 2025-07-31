# Backend API - Dashboard

## Configuração e Execução

### 1. Instalar Dependências

```bash
pip install -r requirements.txt
```

### 2. Executar o Backend

```bash
python run_backend.py
```

Ou diretamente com uvicorn:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Endpoints Disponíveis

- **Health Check:** `GET /health`
- **Carteiras:** `GET /api/carteiras`
- **Usuários Admin:** `PUT /admin/users/{user_id}`
- **Reset Password:** `POST /admin/users/{user_id}/reset-password`
- **Ensure User:** `POST /admin/ensure-user`

### 4. Banco de Dados

O banco SQLite será criado automaticamente em `app/dashboard.db` com as carteiras:
- AGUAS
- VUON

### 5. Documentação da API

Após executar, acesse: `http://localhost:8000/docs`

## Estrutura do Projeto

```
backend_api_skeleton/
├── app/
│   ├── main.py              # Aplicação principal
│   ├── database.py          # Configuração do banco
│   ├── security.py          # Autenticação e autorização
│   ├── models.py            # Modelos de dados
│   └── routers/
│       ├── carteiras.py     # Endpoints de carteiras
│       └── criterios.py     # Endpoints de critérios
├── requirements.txt         # Dependências Python
├── init_db.py              # Script de inicialização do banco
├── run_backend.py          # Script para executar o servidor
└── README.md               # Este arquivo
``` 