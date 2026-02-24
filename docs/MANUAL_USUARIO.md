# Manual de Usuario - Kaede v3.0

## ¿Qué es Kaede?

Kaede es tu asistente conversacional personal inspirada en **Ukyo Kuonji** de Ranma 1/2. Es una PWA (Progressive Web App) que funciona tanto en navegador como instalada en tu dispositivo móvil o computadora.

---

## Instalación de la PWA

### En iPhone/iPad (Safari):
1. Abre la app en Safari
2. Toca el botón de compartir (cuadro con flecha)
3. Selecciona "Añadir a pantalla de inicio"
4. Nombra la app "Kaede" y confirma

### En Android (Chrome):
1. Abre la app en Chrome
2. Toca el menú (tres puntos)
3. Selecciona "Añadir a pantalla de inicio" o "Instalar app"
4. Confirma la instalación

### En Mac/Windows (Chrome/Edge):
1. Abre la app en el navegador
2. Busca el ícono de instalación en la barra de direcciones
3. Haz clic en "Instalar"

---

## Navegación Principal

### 💬 Chat
La pantalla principal donde conversas con Kaede.

**Funciones:**
- Escribe mensajes en el campo de texto
- Adjunta archivos (TXT, MD, CSV, JSON, PDF, imágenes)
- Usa el micrófono para dictar (si está habilitado)
- Los mensajes de Kaede pueden leerse en voz alta (si TTS está habilitado)

**Indicadores de modo:**
- 🟢 **Modo Nube**: Usa GPT-5.2 u otro modelo en la nube
- 🔵 **Modo PC**: Usa Ollama en tu computadora local

### 📖 Historial
Notas guardadas de conversaciones importantes.

**Funciones:**
- Busca notas por contenido
- Toca una nota para ver el contenido completo
- Elimina notas que ya no necesites

**Cómo guardar una nota:**
1. En el chat, toca el ícono 💾 en cualquier mensaje de Kaede
2. La nota se guardará automáticamente

### 🕸️ Telaraña (Memorias)
El sistema de memoria a largo plazo de Kaede.

**Tipos de memorias:**

1. **⭐ Núcleo - Nunca olvidar**
   - Recuerdos críticos que siempre estarán presentes
   - Importancia máxima (10/10)
   - Ejemplo: "Soy muy importante para ti"

2. **🎭 Identidad**
   - Información estable sobre ti
   - Nombre, gustos, trabajo, relaciones
   - Importancia alta (8/10)

3. **✨ Experiencias**
   - Recuerdos de conversaciones pasadas
   - Eventos, anécdotas compartidas
   - Importancia media (6/10)

**Gestión de memorias:**
- ➕ Agregar nueva memoria manualmente
- ✏️ Editar memoria existente
- 🗑️ Eliminar memoria

**Cómo guardar desde el chat:**
1. Toca el ícono ⭐ en cualquier mensaje de Kaede
2. Selecciona el tipo de memoria
3. Confirma el guardado

### 📦 Buffer
La memoria a corto plazo de Kaede (conversación actual).

**Información:**
- Muestra cuántos mensajes hay en el buffer actual
- Estos mensajes se usan como contexto inmediato

**Limpiar Buffer:**
- Borra la conversación actual
- NO afecta las notas guardadas ni las memorias
- Útil para empezar una conversación fresca

### ⚙️ Ajustes
Configura la app según tus preferencias.

---

## Configuración Detallada

### 🌐 Modo de Conexión

**Modo Nube (Cloud):**
- Usa servidores de IA en internet
- Modelos disponibles: GPT-5.2, GPT-4o, Claude, etc.
- Requiere conexión a internet
- Mejor calidad de respuestas

**Modo PC (Local):**
- Usa Ollama en tu computadora
- Modelos disponibles: Llama 3.2, Mistral, etc.
- Funciona sin internet (después de descargar modelos)
- Privacidad total - nada sale de tu PC

**Configurar Modo PC:**
1. Instala Ollama: https://ollama.ai
2. Descarga un modelo: `ollama pull llama3.2`
3. Ejecuta Ollama: `ollama serve`
4. En Ajustes, cambia a "Modo PC"
5. URL por defecto: `http://localhost:11434`

### 🎨 Tema
- **Claro**: Colores claros (ivory, navy)
- **Oscuro**: Modo nocturno
- **Sistema**: Detecta la preferencia de tu dispositivo

### 🎤 Voz

**Entrada de voz (STT):**
- Habilita el micrófono en el chat
- Dicta tus mensajes en español mexicano
- Toca el micrófono para iniciar/detener

**Salida de voz (TTS):**
- Kaede lee sus respuestas en voz alta
- Voz femenina en español mexicano
- Ajusta velocidad con el slider

**Ajustes de voz:**
- Velocidad: 0.5x a 2x (recomendado 1.1x)
- Tono: 0.5 a 2 (recomendado 1.15x para estilo anime)

### 💾 Respaldo

**Exportar:**
1. Toca "Exportar Respaldo"
2. Se descarga un archivo JSON con:
   - Todas tus memorias
   - Todas tus notas guardadas
3. Guarda el archivo en un lugar seguro

**Importar:**
1. Toca "Importar Respaldo"
2. Selecciona el archivo JSON
3. El sistema valida el formato
4. Muestra cuántos elementos se importarán
5. Confirma para agregar los datos

**Nota:** La importación AGREGA datos, no reemplaza.

---

## Adjuntar Archivos

**Tipos soportados:**
- 📄 TXT, MD: Texto plano
- 📊 CSV, JSON: Datos estructurados
- 📕 PDF: Documentos (extracción de texto)
- 🖼️ Imágenes: JPG, PNG, GIF, WebP

**Límites:**
- Tamaño máximo: 5MB por archivo
- El contenido se inyecta en el contexto de la conversación

**Uso:**
1. Toca el ícono 📎 en el chat
2. Selecciona el archivo
3. Escribe tu mensaje sobre el archivo
4. Kaede analizará el contenido

---

## Consejos de Uso

### Para mejores conversaciones:
- Sé específico en tus preguntas
- Recuerda que Kaede tiene personalidad de Ukyo
- Guarda memorias importantes para que Kaede las recuerde

### Para mejor rendimiento:
- Limpia el buffer ocasionalmente
- Usa Modo PC para privacidad
- Usa Modo Nube para mejor calidad

### Solución de problemas:

**"No puedo conectar a Ollama"**
- Verifica que Ollama esté ejecutándose
- Revisa la URL en Ajustes
- En Mac, ejecuta: `ollama serve`

**"La voz no funciona"**
- Verifica permisos de micrófono en el navegador
- TTS requiere voces en español instaladas en tu sistema

---

## Privacidad

- **Modo Nube**: Los mensajes se procesan en servidores externos
- **Modo PC**: Todo se procesa localmente
- **Supabase**: Almacena memorias y notas de forma segura
- **LocalStorage**: Almacena configuraciones en tu dispositivo

---

© 2026 Kaede - Inspirada en Ukyo Kuonji
