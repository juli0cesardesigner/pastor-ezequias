-- ==============================================================================
-- Schema do Banco de Dados Neon (PostgreSQL) - Pastor Ezequias
-- Gerenciamento de Contagem de Apoiadores e Registro de Fotos Geradas
-- ==============================================================================

-- 1. Tabela Principal de Contadores (Leitura e Atualização O(1) Ultra-Rápida)
CREATE TABLE IF NOT EXISTS campaign_counters (
  id VARCHAR(50) PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Log de Apoiadores (Histórico para métricas e auditoria)
CREATE TABLE IF NOT EXISTS supporters_log (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL DEFAULT 'pastor_ezequias',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Inserir o contador inicial da campanha (caso não exista)
INSERT INTO campaign_counters (id, count)
VALUES ('pastor_ezequias_supporters', 1240)
ON CONFLICT (id) DO NOTHING;

-- 4. Função Atômica para Incrementar e Registrar em uma única transação
CREATE OR REPLACE FUNCTION increment_supporters_counter(p_campaign_id VARCHAR(50) DEFAULT 'pastor_ezequias_supporters')
RETURNS BIGINT AS $$
DECLARE
  v_new_count BIGINT;
BEGIN
  -- Incrementa o contador atômico
  UPDATE campaign_counters
  SET count = count + 1,
      updated_at = CURRENT_TIMESTAMP
  WHERE id = p_campaign_id
  RETURNING count INTO v_new_count;

  -- Registra no histórico
  INSERT INTO supporters_log (campaign_id)
  VALUES ('pastor_ezequias');

  RETURN v_new_count;
END;
$$ LANGUAGE plpgsql;
