import sqlite3
import os

def init_database():
    """Inicializa o banco de dados com as tabelas e dados básicos"""
    
    # Conectar ao banco (criará se não existir)
    conn = sqlite3.connect('app/dashboard.db')
    cursor = conn.cursor()
    
    # Criar tabela de carteiras
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS carteiras (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL UNIQUE,
            descricao TEXT,
            ativo BOOLEAN DEFAULT 1
        )
    ''')
    
    # Inserir carteiras básicas
    carteiras = [
        ('AGUAS', 'Carteira Águas', 1),
        ('VUON', 'Carteira VUON', 1)
    ]
    
    for carteira in carteiras:
        cursor.execute('''
            INSERT OR IGNORE INTO carteiras (nome, descricao, ativo) 
            VALUES (?, ?, ?)
        ''', carteira)
    
    # Criar tabela de usuários (se não existir)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT NOT NULL UNIQUE,
            full_name TEXT NOT NULL,
            password_hash TEXT,
            active BOOLEAN DEFAULT 1
        )
    ''')
    
    # Criar tabela de permissões (se não existir)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT
        )
    ''')
    
    # Criar tabela de permissões de usuário (se não existir)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_permissions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            permission_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (permission_id) REFERENCES permissions (id),
            UNIQUE(user_id, permission_id)
        )
    ''')
    
    # Criar tabela de critérios (se não existir)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS criterios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            descricao TEXT,
            categoria TEXT,
            ativo BOOLEAN DEFAULT 1
        )
    ''')
    
    # Inserir critérios de exemplo
    criterios = [
        ('Identificação do Cliente', 'Verificar se o agente identificou corretamente o cliente', 'Identificação', 1),
        ('Cumprimento de Script', 'Verificar se o agente seguiu o script obrigatório', 'Script', 1),
        ('Falha Crítica', 'Verificar se houve falha crítica na comunicação', 'Crítica', 1),
        ('Tom de Voz', 'Avaliar o tom de voz do agente', 'Comunicação', 1),
        ('Resolução do Problema', 'Verificar se o problema foi resolvido', 'Resolução', 1)
    ]
    
    for criterio in criterios:
        cursor.execute('''
            INSERT OR IGNORE INTO criterios (nome, descricao, categoria, ativo) 
            VALUES (?, ?, ?, ?)
        ''', criterio)
    
    # Criar tabela de carteira_criterios (se não existir)
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS carteira_criterios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            carteira_id INTEGER NOT NULL,
            criterio_id INTEGER NOT NULL,
            ordem INTEGER DEFAULT 0,
            peso_especifico REAL DEFAULT 1.0,
            FOREIGN KEY (carteira_id) REFERENCES carteiras (id),
            FOREIGN KEY (criterio_id) REFERENCES criterios (id),
            UNIQUE(carteira_id, criterio_id)
        )
    ''')
    
    # Associar critérios às carteiras
    # Buscar IDs das carteiras
    cursor.execute("SELECT id FROM carteiras WHERE nome = 'AGUAS'")
    carteira_aguas_id = cursor.fetchone()[0]
    
    cursor.execute("SELECT id FROM carteiras WHERE nome = 'VUON'")
    carteira_vuon_id = cursor.fetchone()[0]
    
    # Buscar IDs dos critérios
    cursor.execute("SELECT id FROM criterios")
    criterio_ids = [row[0] for row in cursor.fetchall()]
    
    # Associar todos os critérios às carteiras
    for criterio_id in criterio_ids:
        # AGUAS
        cursor.execute('''
            INSERT OR IGNORE INTO carteira_criterios (carteira_id, criterio_id, ordem, peso_especifico) 
            VALUES (?, ?, ?, ?)
        ''', (carteira_aguas_id, criterio_id, criterio_id, 1.0))
        
        # VUON
        cursor.execute('''
            INSERT OR IGNORE INTO carteira_criterios (carteira_id, criterio_id, ordem, peso_especifico) 
            VALUES (?, ?, ?, ?)
        ''', (carteira_vuon_id, criterio_id, criterio_id, 1.0))
    
    # Commit e fechar conexão
    conn.commit()
    conn.close()
    
    print("Banco de dados inicializado com sucesso!")
    print("Carteiras criadas: AGUAS, VUON")
    print("Critérios criados e associados às carteiras")

if __name__ == "__main__":
    init_database() 