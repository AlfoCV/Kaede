export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildContext } from '@/lib/context-builder';
import { USER_ID, KAEDE_SYSTEM_PROMPT } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      maxTokens = 2000, 
      temperature = 0.8, 
      model = 'gpt-5.2',
      mode = 'cloud',
      ollamaUrl = 'http://localhost:11434',
      fileContent = null // For file processing
    } = body ?? {};

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch memories for context
    const { data: memories } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', USER_ID)
      .order('importance', { ascending: false })
      .order('last_used_at', { ascending: false });

    // Fetch buffer messages for context
    const { data: bufferMessages } = await supabase
      .from('messages')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('is_in_buffer', true)
      .order('created_at', { ascending: true });

    // Build context with memories
    const contextMessages = buildContext(memories ?? [], bufferMessages ?? [], maxTokens);

    // Add file content if provided
    let userMessage = message;
    if (fileContent) {
      userMessage = `[Archivo adjunto]\n\nContenido del archivo:\n${fileContent}\n\n---\n\nMensaje del usuario: ${message}`;
    }

    // Add the new user message
    contextMessages.push({ role: 'user', content: userMessage });

    // Route to appropriate API based on mode
    if (mode === 'pc') {
      return handleOllamaRequest(contextMessages, model, temperature, ollamaUrl);
    } else {
      return handleCloudRequest(contextMessages, model, temperature, maxTokens);
    }
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle Cloud Mode (OpenAI)
async function handleCloudRequest(
  contextMessages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number
) {
  // Use OpenAI API directly
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: model,
      messages: contextMessages,
      stream: true,
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  });

  if (!response?.ok) {
    const error = await response?.text?.();
    console.error('OpenAI API error:', error);
    return NextResponse.json({ error: 'Failed to get response from OpenAI' }, { status: 500 });
  }

  return streamResponse(response);
}

// Handle PC Mode (Ollama)
async function handleOllamaRequest(
  contextMessages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  ollamaUrl: string
) {
  try {
    // Ollama uses OpenAI-compatible API
    const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        messages: contextMessages,
        stream: true,
        temperature: temperature,
      }),
    });

    if (!response?.ok) {
      const errorText = await response?.text?.();
      console.error('Ollama API error:', errorText);
      
      // Return helpful error messages
      if (response.status === 404) {
        return NextResponse.json({ 
          error: `Modelo '${model}' no encontrado. Asegúrate de haberlo descargado con: ollama pull ${model}` 
        }, { status: 404 });
      }
      
      return NextResponse.json({ 
        error: 'No se pudo conectar con Ollama. Verifica que esté ejecutándose en tu Mac.' 
      }, { status: 500 });
    }

    return streamResponse(response);
  } catch (error: unknown) {
    console.error('Ollama connection error:', error);
    
    // Check if it's a connection error
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('fetch failed')) {
      return NextResponse.json({ 
        error: 'No se pudo conectar con Ollama. Asegúrate de que:\n1. Ollama esté instalado\n2. El servicio esté corriendo (ollama serve)\n3. La URL sea correcta' 
      }, { status: 503 });
    }
    
    return NextResponse.json({ error: 'Error al conectar con Ollama' }, { status: 500 });
  }
}

// Stream response helper
function streamResponse(response: Response) {
  const stream = new ReadableStream({
    async start(controller) {
      const reader = response?.body?.getReader();
      const decoder = new TextDecoder();
      const encoder = new TextEncoder();

      try {
        while (true) {
          const { done, value } = await reader?.read?.() ?? { done: true, value: undefined };
          if (done) break;
          const chunk = decoder.decode(value);
          controller.enqueue(encoder.encode(chunk));
        }
      } catch (error) {
        console.error('Stream error:', error);
        controller.error(error);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
