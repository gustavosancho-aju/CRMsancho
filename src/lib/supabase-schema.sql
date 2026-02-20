-- ============================================
-- SCHEMA DO BANCO DE DADOS - DIAGNÓSTICO EMPRESARIAL
-- Execute este SQL no Supabase SQL Editor
-- ============================================

-- Tabela de empresas cadastradas
CREATE TABLE IF NOT EXISTS empresas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  segmento TEXT,
  codigo_acesso TEXT UNIQUE NOT NULL,
  consultor_responsavel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de respostas dos formulários
CREATE TABLE IF NOT EXISTS respostas (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('diretoria', 'equipe')),
  respondente_nome TEXT NOT NULL,
  respondente_cargo TEXT,
  respostas JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de análises geradas pela IA
CREATE TABLE IF NOT EXISTS analises (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  empresa_id UUID REFERENCES empresas(id) ON DELETE CASCADE,
  analise JSONB NOT NULL,
  modelo_ia TEXT DEFAULT 'gpt-4o',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_respostas_empresa ON respostas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_respostas_tipo ON respostas(tipo);
CREATE INDEX IF NOT EXISTS idx_analises_empresa ON analises(empresa_id);
CREATE INDEX IF NOT EXISTS idx_empresas_codigo ON empresas(codigo_acesso);

-- RLS (Row Level Security) - Habilitar conforme necessidade
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE respostas ENABLE ROW LEVEL SECURITY;
ALTER TABLE analises ENABLE ROW LEVEL SECURITY;

-- Política pública para inserção de respostas (formulários são públicos)
CREATE POLICY "Permitir inserção de respostas" ON respostas
  FOR INSERT WITH CHECK (true);

-- Política para leitura apenas via service role (admin)
CREATE POLICY "Leitura admin de respostas" ON respostas
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Leitura admin de empresas" ON empresas
  FOR SELECT USING (true);

CREATE POLICY "Leitura admin de analises" ON analises
  FOR SELECT USING (auth.role() = 'service_role');

CREATE POLICY "Inserção admin de analises" ON analises
  FOR INSERT WITH CHECK (auth.role() = 'service_role');
