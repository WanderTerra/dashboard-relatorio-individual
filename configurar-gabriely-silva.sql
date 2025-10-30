-- Script para configurar Gabriely Silva nas tabelas do sistema
-- Baseado nas informações fornecidas: user_id = 105, agent_id = 1113

-- 1. Primeiro, vamos verificar se a permissão agent_1113 (com underscore) já existe
-- Se não existir, vamos criar
INSERT IGNORE INTO permissions (name, description) 
VALUES ('agent_1113', 'Acesso aos dados do agente Gabriely Silva (ID: 1113)');

-- 2. Obter o ID da permissão agent_1113 (com underscore)
SET @permission_id = (SELECT id FROM permissions WHERE name = 'agent_1113');

-- 3. Criar a entrada na tabela user_permissions
-- Vincular o usuário ID 105 (Gabriely Silva) à permissão agent_1113
INSERT IGNORE INTO user_permissions (user_id, permission_id) 
VALUES (105, @permission_id);

-- 4. Verificar se a configuração foi feita corretamente
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    p.name as permission_name,
    p.description as permission_description
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE u.id = 105;

-- 5. Opcional: Remover a permissão antiga com ponto (agent.1113) se existir
-- CUIDADO: Só execute se tiver certeza de que não há outras referências
-- DELETE FROM user_permissions WHERE permission_id = (SELECT id FROM permissions WHERE name = 'agent.1113');
-- DELETE FROM permissions WHERE name = 'agent.1113';

-- 6. Verificar todas as permissões de Gabriely Silva
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    GROUP_CONCAT(p.name SEPARATOR ', ') as todas_permissoes
FROM users u
LEFT JOIN user_permissions up ON u.id = up.user_id
LEFT JOIN permissions p ON up.permission_id = p.id
WHERE u.id = 105
GROUP BY u.id, u.username, u.full_name;

