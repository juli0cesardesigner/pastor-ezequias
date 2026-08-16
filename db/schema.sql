-- ==============================================================================
-- Schema do Banco de Dados Neon (PostgreSQL) - Pastor Ezequias
-- Gerenciamento de Acessos, Contagem de Apoiadores e Downloads Reais de Fotos
-- ==============================================================================

-- 1. Tabela Principal de Contadores (Leitura e Atualização O(1) Ultra-Rápida)
CREATE TABLE IF NOT EXISTS campaign_counters (
  id VARCHAR(50) PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Log de Eventos (Histórico de acessos e downloads)
CREATE TABLE IF NOT EXISTS supporters_log (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL DEFAULT 'pastor_ezequias',
  event_type VARCHAR(20) DEFAULT 'visit', -- 'visit' ou 'download'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir os contadores da campanha
INSERT INTO campaign_counters (id, count)
VALUES 
  ('pastor_ezequias_supporters', 1),
  ('pastor_ezequias_downloads', 0)
ON CONFLICT (id) DO NOTHING;
