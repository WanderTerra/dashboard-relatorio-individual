-- Script SIMPLES para configurar Gabriely Silva
-- Execute os comandos na ordem:

-- 1. Criar permissão agent_1113 (se não existir)
INSERT IGNORE INTO permissions (name, description) 
VALUES ('agent_1113', 'Acesso aos dados do agente Gabriely Silva (ID: 1113)');

-- 2. Vincular usuário 105 à permissão agent_1113
INSERT IGNORE INTO user_permissions (user_id, permission_id) 
VALUES (105, (SELECT id FROM permissions WHERE name = 'agent_1113'));

-- 3. Verificar se funcionou
SELECT 
    u.id as user_id,
    u.full_name,
    p.name as permission_name
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE u.id = 105;

