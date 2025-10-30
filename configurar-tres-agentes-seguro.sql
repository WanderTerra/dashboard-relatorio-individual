-- Script SEGURO para configurar os três agentes
-- Primeiro vamos identificar os user_ids corretos

-- 1. Buscar os usuários para identificar os IDs corretos
SELECT 
    id as user_id,
    username,
    full_name,
    'Carlos Gonçalves' as agente_esperado
FROM users 
WHERE full_name LIKE '%Carlos%Gonçalves%' 
   OR full_name LIKE '%Carlos%Goncalves%'
   OR username LIKE '%1179%'
   OR username LIKE '%carlos%';

SELECT 
    id as user_id,
    username,
    full_name,
    'Lais Ribeiro' as agente_esperado
FROM users 
WHERE full_name LIKE '%Lais%Ribeiro%'
   OR username LIKE '%1159%'
   OR username LIKE '%lais%';

SELECT 
    id as user_id,
    username,
    full_name,
    'Nathalia Vieira' as agente_esperado
FROM users 
WHERE full_name LIKE '%Nathalia%Vieira%'
   OR username LIKE '%1183%'
   OR username LIKE '%nathalia%';

-- 2. Após identificar os user_ids corretos, execute os comandos abaixo
-- Substitua USER_ID_CARLOS, USER_ID_LAIS, USER_ID_NATHALIA pelos IDs encontrados acima

-- Criar permissões
INSERT IGNORE INTO permissions (name, description) VALUES 
('agent_1179', 'Acesso aos dados do agente Carlos Gonçalves (ID: 1179)'),
('agent_1159', 'Acesso aos dados do agente Lais Ribeiro (ID: 1159)'),
('agent_1183', 'Acesso aos dados do agente Nathalia Vieira (ID: 1183)');

-- Vincular usuários às permissões (substitua pelos IDs corretos)
-- INSERT IGNORE INTO user_permissions (user_id, permission_id) VALUES 
-- (USER_ID_CARLOS, (SELECT id FROM permissions WHERE name = 'agent_1179')),
-- (USER_ID_LAIS, (SELECT id FROM permissions WHERE name = 'agent_1159')),
-- (USER_ID_NATHALIA, (SELECT id FROM permissions WHERE name = 'agent_1183'));

-- 3. Verificar resultado final
-- SELECT 
--     u.id as user_id,
--     u.username,
--     u.full_name,
--     p.name as permission_name
-- FROM users u
-- JOIN user_permissions up ON u.id = up.user_id
-- JOIN permissions p ON up.permission_id = p.id
-- WHERE p.name IN ('agent_1179', 'agent_1159', 'agent_1183')
-- ORDER BY p.name;

