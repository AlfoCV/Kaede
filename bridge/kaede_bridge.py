#!/usr/bin/env python3
"""
Kaede Bridge v1.0.0
Servidor local que conecta la PWA con Ollama

Arquitectura Híbrida:
- Mente: GPT-5.2 (OpenAI/RouteLLM)
- Cuerpo: Ollama (local) para compresión de contexto
- Memoria: Supabase (nube compartida)
"""

import os
import sys
import json
import requests
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)  # Permitir CORS desde cualquier origen

# Configuración
OLLAMA_URL = os.getenv('OLLAMA_URL', 'http://localhost:11434')
OLLAMA_MODEL = os.getenv('OLLAMA_MODEL', 'llama3.2')
PORT = int(os.getenv('BRIDGE_PORT', 5001))

# Colores para terminal
class Colors:
    GREEN = '\033[92m'
    BLUE = '\033[94m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    CYAN = '\033[96m'
    END = '\033[0m'
    BOLD = '\033[1m'

def print_banner():
    """Muestra el banner de inicio"""
    print(f"""
    {Colors.CYAN}╔══════════════════════════════════════════════════╗
    ║       {Colors.BLUE}💙 Kaede Bridge v1.0.0{Colors.CYAN}                    ║
    ║       {Colors.GREEN}Arquitectura Híbrida{Colors.CYAN}                       ║
    ╠══════════════════════════════════════════════════╣
    ║  {Colors.YELLOW}Mente:{Colors.END}   GPT-5.2 (nube)                       {Colors.CYAN}║
    ║  {Colors.YELLOW}Cuerpo:{Colors.END}  Ollama ({OLLAMA_MODEL})                    {Colors.CYAN}║
    ╚══════════════════════════════════════════════════╝{Colors.END}
    """)

def check_ollama():
    """Verifica si Ollama está disponible"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.ok:
            models = response.json().get('models', [])
            model_names = [m.get('name', '') for m in models]
            return True, model_names
        return False, []
    except:
        return False, []

def print_status():
    """Muestra el estado de los servicios"""
    ollama_ok, models = check_ollama()
    
    print(f"    {Colors.BOLD}Configuración:{Colors.END}")
    print(f"    ├─ OLLAMA_URL: {OLLAMA_URL}")
    print(f"    ├─ OLLAMA_MODEL: {OLLAMA_MODEL}")
    print(f"    └─ BRIDGE_PORT: {PORT}")
    print()
    
    if ollama_ok:
        print(f"    {Colors.GREEN}✅ Ollama disponible{Colors.END} - Modelos: {', '.join(models[:5])}")
    else:
        print(f"    {Colors.RED}❌ Ollama no disponible{Colors.END}")
        print(f"    {Colors.YELLOW}   Ejecuta: ollama serve{Colors.END}")
    
    print(f"""
    {Colors.BOLD}Endpoints:{Colors.END}
    ├─ GET  /health              → Estado del bridge
    ├─ GET  /                    → Verificar Ollama
    └─ POST /v1/chat/completions → Chat con Ollama
    
    {Colors.BOLD}Estado:{Colors.END}
    └─ 🦙 Ollama {'ACTIVO' if ollama_ok else 'INACTIVO'}
    
    {Colors.GREEN}¡Listo para conectar con Kaede PWA! Puerto: {PORT}{Colors.END}
    """)

# ==================== ENDPOINTS ====================

@app.route('/health', methods=['GET'])
def health():
    """Endpoint de salud"""
    ollama_ok, models = check_ollama()
    return jsonify({
        'status': 'ok',
        'ollama': ollama_ok,
        'models': models,
        'version': '1.0.0'
    })

@app.route('/', methods=['GET'])
def root():
    """Verificar que el bridge está corriendo"""
    ollama_ok, _ = check_ollama()
    if ollama_ok:
        return 'Kaede Bridge is running - Ollama connected'
    return 'Kaede Bridge is running - Ollama disconnected', 503

@app.route('/api/tags', methods=['GET'])
def ollama_tags():
    """Proxy para obtener modelos de Ollama"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        return jsonify(response.json())
    except Exception as e:
        return jsonify({'error': str(e)}), 502

@app.route('/v1/chat/completions', methods=['POST'])
def chat_completions():
    """Proxy para chat completions de Ollama (formato OpenAI)"""
    try:
        data = request.json
        
        # Log de la petición
        model = data.get('model', OLLAMA_MODEL)
        print(f"    {Colors.BLUE}📨 Chat request{Colors.END} → modelo: {model}")
        
        # Reenviar a Ollama
        response = requests.post(
            f"{OLLAMA_URL}/v1/chat/completions",
            json=data,
            headers={'Content-Type': 'application/json'},
            timeout=120
        )
        
        if response.ok:
            result = response.json()
            # Log de respuesta
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            preview = content[:50] + '...' if len(content) > 50 else content
            print(f"    {Colors.GREEN}✅ Respuesta{Colors.END}: {preview}")
            return jsonify(result)
        else:
            print(f"    {Colors.RED}❌ Error Ollama{Colors.END}: {response.status_code}")
            return jsonify({'error': 'Ollama error'}), response.status_code
            
    except requests.Timeout:
        print(f"    {Colors.RED}❌ Timeout{Colors.END}")
        return jsonify({'error': 'Timeout conectando con Ollama'}), 504
    except Exception as e:
        print(f"    {Colors.RED}❌ Error{Colors.END}: {str(e)}")
        return jsonify({'error': str(e)}), 502

@app.route('/v1/models', methods=['GET'])
def list_models():
    """Lista modelos disponibles en Ollama (formato OpenAI)"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=5)
        if response.ok:
            models = response.json().get('models', [])
            # Convertir a formato OpenAI
            openai_format = {
                'object': 'list',
                'data': [
                    {
                        'id': m.get('name', ''),
                        'object': 'model',
                        'owned_by': 'ollama'
                    } for m in models
                ]
            }
            return jsonify(openai_format)
        return jsonify({'error': 'No se pudo obtener modelos'}), 502
    except Exception as e:
        return jsonify({'error': str(e)}), 502

# ==================== MAIN ====================

if __name__ == '__main__':
    print_banner()
    print_status()
    
    # Verificar Ollama antes de iniciar
    ollama_ok, _ = check_ollama()
    if not ollama_ok:
        print(f"\n    {Colors.YELLOW}⚠️  Ollama no está corriendo.{Colors.END}")
        print(f"    {Colors.YELLOW}   El bridge iniciará pero no podrá procesar peticiones.{Colors.END}")
        print(f"    {Colors.YELLOW}   Ejecuta en otra terminal: ollama serve{Colors.END}\n")
    
    # Iniciar servidor
    print(f" * Serving Kaede Bridge on http://0.0.0.0:{PORT}")
    print(f" * Running on http://127.0.0.1:{PORT}")
    
    # Obtener IP local para mostrar
    import socket
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        local_ip = s.getsockname()[0]
        s.close()
        print(f" * Running on http://{local_ip}:{PORT}")
    except:
        pass
    
    print("Press CTRL+C to quit\n")
    
    app.run(host='0.0.0.0', port=PORT, debug=False)
