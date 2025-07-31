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
    
    # Commit e fechar conexão
    conn.commit()
    conn.close()
    
    print("Banco de dados inicializado com sucesso!")
    print("Carteiras criadas: AGUAS, VUON")

if __name__ == "__main__":
    init_database() 