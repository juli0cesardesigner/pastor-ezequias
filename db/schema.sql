-- ==============================================================================
-- Schema do Banco de Dados Neon (PostgreSQL) - Pastor Ezequias
-- Contagem de Apoiadores, Downloads, Catálogo e Pedidos de Materiais
-- ==============================================================================

-- 1. Tabela Principal de Contadores
CREATE TABLE IF NOT EXISTS campaign_counters (
  id VARCHAR(50) PRIMARY KEY,
  count BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Tabela de Log de Eventos (Histórico de acessos e downloads)
CREATE TABLE IF NOT EXISTS supporters_log (
  id BIGSERIAL PRIMARY KEY,
  campaign_id VARCHAR(50) NOT NULL DEFAULT 'pastor_ezequias',
  event_type VARCHAR(20) DEFAULT 'visit',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Tabela de Configurações Gerais da Campanha (ex: WhatsApp de Destino)
CREATE TABLE IF NOT EXISTS campaign_settings (
  key VARCHAR(50) PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. Tabela de Catálogo de Materiais Físicos Gerenciável via Admin
CREATE TABLE IF NOT EXISTS materials_catalog (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  image_url TEXT,
  badge_text VARCHAR(50),
  has_limit BOOLEAN NOT NULL DEFAULT true,
  max_quantity INT NOT NULL DEFAULT 10,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Tabela de Pedidos de Materiais Físicos por Apoiadores
CREATE TABLE IF NOT EXISTS material_requests (
  id BIGSERIAL PRIMARY KEY,
  supporter_name VARCHAR(150) NOT NULL,
  whatsapp VARCHAR(30) NOT NULL,
  cep VARCHAR(10) NOT NULL,
  street VARCHAR(150) NOT NULL,
  number VARCHAR(20) NOT NULL,
  complement VARCHAR(100),
  neighborhood VARCHAR(100) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(10) NOT NULL,
  reference_point VARCHAR(200),
  items_json JSONB NOT NULL,
  notes TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Tabela de Roteiros Compartilhados do Teleprompter
CREATE TABLE IF NOT EXISTS teleprompter_scripts (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(200) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(80) NOT NULL DEFAULT 'Geral',
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. Inserir Contadores e Configurações Iniciais
INSERT INTO campaign_counters (id, count)
VALUES 
  ('pastor_ezequias_supporters', 1),
  ('pastor_ezequias_downloads', 0)
ON CONFLICT (id) DO NOTHING;

INSERT INTO campaign_settings (key, value)
VALUES 
  ('whatsapp_destination', '5527999999999')
ON CONFLICT (key) DO NOTHING;

-- 7. Inserir Itens Padrão do Catálogo de Materiais
INSERT INTO materials_catalog (id, name, description, badge_text, has_limit, max_quantity, is_active, display_order)
VALUES 
  ('adesivo_carro', 'Adesivo de Carro / Parachoque', 'Adesivo vinílico de alta durabilidade e resistente a sol e chuva.', 'Mais Pedido', true, 5, true, 1),
  ('praguinha', 'Praguinha / Adesivo de Peito', 'Adesivo circular para colar na camisa e demonstrar apoio no dia a dia.', 'Popular', true, 30, true, 2),
  ('santinhos', 'Santinhos / Panfletos Informativos', 'Material impresso com propostas, histórico e informações do Pastor Ezequias.', 'Divulgação', true, 100, true, 3),
  ('cartaz_perfurado', 'Cartaz / Perfurado para Vidro Traseiro', 'Película perfurada com visão de dentro para fora para vidro traseiro de veículos.', 'Destaque', true, 2, true, 4)
ON CONFLICT (id) DO NOTHING;

-- 8. Tabela de Usuários da Agenda da Equipe
CREATE TABLE IF NOT EXISTS campaign_agenda_users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  username VARCHAR(80) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(80) NOT NULL DEFAULT 'Equipe',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inserir usuário inicial padrão caso a tabela esteja vazia
INSERT INTO campaign_agenda_users (name, username, password_hash, role, is_active)
VALUES ('Pastor Ezequias / Coordenação', 'admin', 'ezequias2026', 'Coordenação', true)
ON CONFLICT (username) DO NOTHING;

-- 9. Tabela de Eventos e Compromissos da Agenda Diária
CREATE TABLE IF NOT EXISTS campaign_agenda_events (
  id SERIAL PRIMARY KEY,
  event_date VARCHAR(20) NOT NULL,
  event_time VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status VARCHAR(30) NOT NULL DEFAULT 'pendente',
  priority VARCHAR(20) NOT NULL DEFAULT 'media',
  event_type VARCHAR(50) NOT NULL DEFAULT 'compromisso',
  created_by_name VARCHAR(150) NOT NULL DEFAULT 'Equipe',
  created_by_user_id INT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

