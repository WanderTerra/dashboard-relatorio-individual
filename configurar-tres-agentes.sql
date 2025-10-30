-- Script para configurar Carlos Gonçalves, Lais Ribeiro e Nathalia Vieira
-- Carlos Gonçalves - Agent ID: 1179
-- Lais Ribeiro - Agent ID: 1159  
-- Nathalia Vieira - Agent ID: 1183

-- 1. Criar permissões para os três agentes
INSERT IGNORE INTO permissions (name, description) VALUES 
('agent_1179', 'Acesso aos dados do agente Carlos Gonçalves (ID: 1179)'),
('agent_1159', 'Acesso aos dados do agente Lais Ribeiro (ID: 1159)'),
('agent_1183', 'Acesso aos dados do agente Nathalia Vieira (ID: 1183)');

-- 2. Vincular usuários às suas respectivas permissões
-- Carlos Gonçalves (assumindo que o user_id dele é baseado no agent_id ou próximo)
INSERT IGNORE INTO user_permissions (user_id, permission_id) 
VALUES (
    (SELECT id FROM users WHERE username LIKE '%carlos%gonçalves%' OR username LIKE '%carlos%goncalves%' OR username LIKE '%1179%' LIMIT 1),
    (SELECT id FROM permissions WHERE name = 'agent_1179')
);

-- Lais Ribeiro
INSERT IGNORE INTO user_permissions (user_id, permission_id) 
VALUES (
    (SELECT id FROM users WHERE username LIKE '%lais%ribeiro%' OR username LIKE '%1159%' LIMIT 1),
    (SELECT id FROM permissions WHERE name = 'agent_1159')
);

-- Nathalia Vieira
INSERT IGNORE INTO user_permissions (user_id, permission_id) 
VALUES (
    (SELECT id FROM users WHERE username LIKE '%nathalia%vieira%' OR username LIKE '%1183%' LIMIT 1),
    (SELECT id FROM permissions WHERE name = 'agent_1183')
);

-- 3. Verificar se as configurações foram feitas corretamente
SELECT 
    u.id as user_id,
    u.username,
    u.full_name,
    p.name as permission_name,
    p.description as permission_description
FROM users u
JOIN user_permissions up ON u.id = up.user_id
JOIN permissions p ON up.permission_id = p.id
WHERE p.name IN ('agent_1179', 'agent_1159', 'agent_1183')
ORDER BY p.name;

