# 🌸 Kaede PWA - Asistente Conversacional

Kaede es una PWA (Progressive Web App) de asistente conversacional con un sistema de memoria híbrido, inspirada en Ukyo Kuonji de Ranma 1/2.

## ✨ Características (Fase 1)

- **Chat con IA**: Conversaciones con personalidad única basada en Ukyo Kuonji
- **Sistema de Memoria Híbrido**:
  - **Buffer**: Contexto actual de conversación (memoria a corto plazo)
  - **Historial**: Notas guardadas que persisten
  - **Telaraña**: Memorias estructuradas (Núcleo, Identidad, Experiencias)
- **PWA Instalable**: Funciona en desktop y móvil como app nativa
- **UI Hermosa**: Diseño moderno con paleta de colores personalizada
- **Vibración Háptica**: Feedback táctil en interacciones (opcional)
- **Modo Nube**: Conexión con OpenAI GPT-4o

## 🛠️ Configuración Inicial

### 1. Crear tablas en Supabase

Antes de usar Kaede, debes crear las tablas en tu base de datos Supabase.

1. Abre el [SQL Editor de Supabase](https://supabase.com/dashboard/project/gjdzqqfovrxtwraflwtn/sql/new)
2. Copia y ejecuta el siguiente SQL:

```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_in_buffer BOOLEAN DEFAULT true
);

CREATE TABLE saved_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  message_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);

-- Índices para mejor rendimiento
CREATE INDEX idx_messages_user_buffer ON messages(user_id, is_in_buffer);
CREATE INDEX idx_saved_notes_user ON saved_notes(user_id);
CREATE INDEX idx_memories_user_type ON memories(user_id, type);
```

3. Haz clic en "Run" para ejecutar
4. Vuelve a Kaede y haz clic en "Reintentar conexión"

### 2. Variables de Entorno

El archivo `.env` ya está configurado con:

```env
NEXT_PUBLIC_SUPABASE_URL=https://gjdzqqfovrxtwraflwtn.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
ABACUSAI_API_KEY=...
```

## 📱 Uso de la App

### Chat
- Escribe mensajes para conversar con Kaede
- Kaede responderá con su personalidad única
- Cada respuesta tiene botones:
  - 💾 **Guardar**: Guarda el mensaje como nota
  - ⭐ **Favorito**: Guarda como memoria permanente
  - 📋 **Copiar**: Copia el texto al portapapeles

### Historial
- Ver todas las notas guardadas
- Buscar notas por contenido
- Hacer clic para ver el contenido completo
- Eliminar notas que ya no necesites

### Telaraña
- **Núcleo (Nunca olvidar)**: Memorias críticas, siempre incluidas en el contexto
- **Identidad**: Información estable sobre ti (preferencias, datos personales)
- **Experiencias**: Eventos y situaciones específicas

### Buffer
- Ver el contexto actual de la conversación
- "Limpiar Buffer" elimina el contexto pero mantiene notas y memorias

### Ajustes
- **Modelo**: Elegir entre GPT-4o o GPT-4o-mini
- **Max Tokens**: Límite de tokens para el contexto
- **Temperatura**: Creatividad de las respuestas (0-1)
- **Vibración**: Activar/desactivar feedback háptico

## 🎨 Paleta de Colores

| Color | Código | Uso |
|-------|--------|-----|
| Azul marino | #0B1F3B | Sidebar |
| Marfil | #FFF6E9 | Fondo principal |
| Rojo ladrillo | #C4473D | Acentos, botón enviar |
| Azul grisáceo | #9FB3C8 | Hover, detalles |
| Verde apagado | #2E7D6B | Éxito |

## 📁 Estructura del Proyecto

```
kaede_pwa/
└── nextjs_space/
    ├── app/
    │   ├── api/chat/     # API de chat con OpenAI
    │   ├── globals.css   # Estilos globales
    │   ├── layout.tsx    # Layout principal
    │   └── page.tsx      # Página principal
    ├── components/
    │   ├── views/        # Vistas (Chat, Historial, etc.)
    │   ├── sidebar.tsx   # Sidebar de navegación
    │   ├── message-bubble.tsx
    │   ├── chat-input.tsx
    │   └── ...
    ├── hooks/
    │   ├── use-settings.ts   # Hook de configuración
    │   └── use-supabase.ts   # Hooks de Supabase
    ├── lib/
    │   ├── constants.ts      # Constantes y prompts
    │   ├── context-builder.ts # Construcción de contexto
    │   ├── database.types.ts # Tipos de TypeScript
    │   └── supabase.ts       # Cliente Supabase
    ├── public/
    │   ├── avatar.jpg        # Avatar de Kaede
    │   ├── icon.png          # Ícono de la app
    │   ├── manifest.json     # Manifest PWA
    │   └── sw.js             # Service Worker
    └── scripts/
        └── setup-tables.sql  # SQL de configuración
```

## 🚀 Próximas Fases

### Fase 2 (Próxima conversación)
- ✅ Modo PC con Ollama
- ✅ Backend Python con FastAPI
- ✅ Procesamiento de imágenes/archivos
- ✅ Botón de cambio Nube/PC

### Fase 3 (Siguiente conversación)
- ✅ Sistema de weight dinámico
- ✅ RAG con embeddings vectoriales
- ✅ Decay y consolidación automática
- ✅ Telaraña visual completa

## 💜 Créditos

- **Personalidad**: Inspirada en Ukyo Kuonji de Ranma 1/2
- **IA**: OpenAI GPT-4o vía RouteLLM
- **Base de datos**: Supabase
- **Framework**: Next.js 14

---

*Kaede es tu asistente personal que recuerda y crece contigo.* 🌸
