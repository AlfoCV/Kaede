import { NextRequest, NextResponse } from 'next/server';

const OLLAMA_URL = 'http://localhost:11434';

/**
 * Proxy para Ollama - evita problemas de CORS
 * GET /api/ollama - verifica si Ollama está disponible
 */
export async function GET() {
  try {
    const response = await fetch(OLLAMA_URL, {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    
    if (response.ok) {
      const text = await response.text();
      return NextResponse.json({ available: text.includes('Ollama'), message: text });
    }
    
    return NextResponse.json({ available: false }, { status: 502 });
  } catch (error) {
    return NextResponse.json({ available: false, error: 'Ollama no disponible' }, { status: 502 });
  }
}

/**
 * POST /api/ollama - reenvía peticiones de chat a Ollama
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const response = await fetch(`${OLLAMA_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    
    if (!response.ok) {
      return NextResponse.json(
        { error: 'Error de Ollama' },
        { status: response.status }
      );
    }
    
    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Ollama proxy error:', error);
    return NextResponse.json(
      { error: 'Error conectando con Ollama' },
      { status: 502 }
    );
  }
}
