# 💙 Kaede Bridge

Servidor local que conecta la PWA de Kaede con Ollama para el modo híbrido.

## 🏗️ Arquitectura

```
Kaede PWA (Vercel) → Kaede Bridge (tu Mac) → Ollama (local)
                  ↘                        ↗
                    Supabase (memorias)
```

## 📦 Instalación

### 1. Requisitos
- Python 3.8+
- Ollama instalado y corriendo

### 2. Setup

```bash
cd bridge
chmod +x setup.sh
./setup.sh
```

### 3. Configuración

Edita `.env` si necesitas cambiar la configuración:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
BRIDGE_PORT=5001
```

## 🚀 Uso

### Opción A: Manual

```bash
cd bridge
source venv/bin/activate
python kaede_bridge.py
```

### Opción B: Alias (recomendado)

Agrega a tu `~/.zshrc` o `~/.bashrc`:

```bash
alias kaede-bridge='cd /ruta/a/kaede_pwa/bridge && source venv/bin/activate && python kaede_bridge.py'
```

Luego solo ejecuta:

```bash
kaede-bridge
```

## 🌐 Conexión desde la PWA

### Opción 1: Misma red WiFi

1. El bridge muestra tu IP local (ej: `192.168.5.157`)
2. En Kaede PWA → Ajustes → Bridge URL: `http://192.168.5.157:5001`

### Opción 2: Desde internet (ngrok)

```bash
# En otra terminal
ngrok http 5001
```

Copia la URL de ngrok (ej: `https://abc123.ngrok.io`) y úsala en Ajustes.

## 📡 Endpoints

| Método | Endpoint | Descripción |
|--------|----------|-------------|
| GET | `/health` | Estado del bridge |
| GET | `/` | Verificar conexión |
| POST | `/v1/chat/completions` | Chat con Ollama |
| GET | `/v1/models` | Lista de modelos |

## 🔧 Troubleshooting

### "Ollama no disponible"

```bash
# Verifica que Ollama esté corriendo
ollama serve
```

### "Connection refused"

- Verifica que el bridge esté corriendo
- Verifica la URL en Ajustes de Kaede
- Si usas ngrok, asegúrate de que el túnel esté activo

### CORS errors

El bridge ya tiene CORS habilitado. Si ves errores de CORS:
- Asegúrate de usar la URL correcta (http vs https)
- Reinicia el bridge
