#!/bin/bash

# Kaede Bridge Setup Script
echo "💙 Configurando Kaede Bridge..."

# Crear entorno virtual
if [ ! -d "venv" ]; then
    echo "📦 Creando entorno virtual..."
    python3 -m venv venv
fi

# Activar entorno virtual
echo "🔄 Activando entorno virtual..."
source venv/bin/activate

# Instalar dependencias
echo "📥 Instalando dependencias..."
pip install -r requirements.txt

# Crear .env si no existe
if [ ! -f ".env" ]; then
    echo "📝 Creando archivo .env..."
    cp .env.example .env
fi

# Crear alias
echo ""
echo "✅ ¡Setup completado!"
echo ""
echo "Para usar Kaede Bridge:"
echo "  1. Activa el entorno: source venv/bin/activate"
echo "  2. Inicia el bridge:  python kaede_bridge.py"
echo ""
echo "O agrega este alias a tu ~/.zshrc o ~/.bashrc:"
echo "  alias kaede-bridge='cd $(pwd) && source venv/bin/activate && python kaede_bridge.py'"
echo ""
