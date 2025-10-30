-- Script SQL para verificar e corrigir dados de gamificação do agente 1188
-- Execute no banco de dados

-- 1. Verificar conquistas do agente 1188
SELECT 
    a.agent_id,
    a.achievement_type,
    a.achievement_name,
    a.xp_reward,
    a.unlocked_at
FROM achievements a
WHERE a.agent_id = '1188'
ORDER BY a.unlocked_at;

-- 2. Calcular XP total das conquistas
SELECT 
    agent_id,
    COUNT(*) as total_conquistas,
    SUM(xp_reward) as xp_total_conquistas
FROM achievements 
WHERE agent_id = '1188'
GROUP BY agent_id;

-- 3. Verificar dados de gamificação atuais
SELECT 
    agent_id,
    current_level,
    current_xp,
    total_xp_earned,
    level_progress
FROM gamification 
WHERE agent_id = '1188';

-- 4. Se necessário, atualizar manualmente o XP
-- DESCOMENTE E EXECUTE APENAS SE NECESSÁRIO:
-- UPDATE gamification 
-- SET 
--     current_xp = (
--         SELECT COALESCE(SUM(xp_reward), 0) 
--         FROM achievements 
--         WHERE agent_id = '1188'
--     ),
--     total_xp_earned = (
--         SELECT COALESCE(SUM(xp_reward), 0) 
--         FROM achievements 
--         WHERE agent_id = '1188'
--     ),
--     current_level = CASE 
--         WHEN (SELECT COALESCE(SUM(xp_reward), 0) FROM achievements WHERE agent_id = '1188') >= 10000 THEN 5
--         WHEN (SELECT COALESCE(SUM(xp_reward), 0) FROM achievements WHERE agent_id = '1188') >= 5000 THEN 4
--         WHEN (SELECT COALESCE(SUM(xp_reward), 0) FROM achievements WHERE agent_id = '1188') >= 2500 THEN 3
--         WHEN (SELECT COALESCE(SUM(xp_reward), 0) FROM achievements WHERE agent_id = '1188') >= 1000 THEN 2
--         ELSE 1
--     END
-- WHERE agent_id = '1188';

-- 5. Verificar se a atualização funcionou
SELECT 
    agent_id,
    current_level,
    current_xp,
    total_xp_earned,
    level_progress
FROM gamification 
WHERE agent_id = '1188';



