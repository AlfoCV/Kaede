-- =====================================================
-- KAEDE PWA - Script de Configuración de Base de Datos
-- =====================================================
-- 
-- Este script crea las tablas necesarias para Kaede PWA.
-- Ejecuta este SQL en el Editor SQL de tu proyecto Supabase:
-- https://supabase.com/dashboard/project/gjdzqqfovrxtwraflwtn/sql/new
--
-- =====================================================

-- Tabla de mensajes (buffer de conversación)
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_in_buffer BOOLEAN DEFAULT true
);

-- Tabla de notas guardadas
CREATE TABLE IF NOT EXISTS saved_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla de memorias (telaraña)
CREATE TABLE IF NOT EXISTS memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL CHECK (type IN ('core', 'identity', 'experience')),
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 3 CHECK (importance >= 1 AND importance <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Índices para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_messages_user_buffer ON messages(user_id, is_in_buffer);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_saved_notes_user ON saved_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_notes_created_at ON saved_notes(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_importance ON memories(importance DESC);
CREATE INDEX IF NOT EXISTS idx_memories_last_used ON memories(last_used_at DESC);

-- =====================================================
-- Configuración de políticas RLS (Row Level Security)
-- Nota: Para uso personal, dejamos RLS deshabilitado
-- =====================================================

-- Si quieres habilitar RLS en el futuro, descomenta esto:
-- ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE saved_notes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Verificación
-- =====================================================

SELECT 'Tablas creadas exitosamente!' AS status;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('messages', 'saved_notes', 'memories');
