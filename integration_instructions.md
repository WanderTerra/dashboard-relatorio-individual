# Instruções para Integrar Autenticação no Backend Principal

## O que você precisa fazer:

1. **Copie os arquivos de autenticação para seu backend principal:**
   - `backend/app/routers/auth.py` → seu projeto
   - `backend/app/security.py` → seu projeto  
   - `backend/app/models.py` (apenas as funções de usuário) → seu projeto

2. **Adicione no seu main.py:**
   ```python
   # No início do arquivo
   from app.routers.auth import router as auth_router
   
   # Após criar o app FastAPI
   app.include_router(auth_router, prefix="/auth", tags=["authentication"])
   ```

3. **Adicione dependências no requirements.txt:**
   ```
   python-jose[cryptography]
   passlib[bcrypt]
   python-multipart
   ```

4. **Crie as tabelas de usuários no banco:**
   Execute uma vez para criar a tabela `users` no MySQL

## Ou me diga em qual porta está rodando seu backend principal

Se seu backend principal está em porta diferente de 8000, me informe a porta para configurar o proxy corretamente.
