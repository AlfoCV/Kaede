export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { buildContext } from '@/lib/context-builder';
import { USER_ID, KAEDE_SYSTEM_PROMPT } from '@/lib/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * ARQUITECTURA HÍBRIDA:
 * - Kaede SIEMPRE usa GPT-5.2 (su mente/personalidad)
 * - En modo PC, el contexto viene pre-comprimido por Ollama (ahorra tokens)
 * - En modo Cloud, se construye el contexto completo aquí
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      message, 
      maxTokens = 2000, 
      temperature = 0.8, 
      model = 'gpt-5.2',
      fileContent = null,
      // Contexto comprimido por Ollama (modo PC híbrido)
      compressedContext = null
    } = body ?? {};

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    let contextMessages: Array<{ role: string; content: string }>;

    // Si hay contexto comprimido (viene de modo PC con Ollama), usarlo
    if (compressedContext) {
      // Usar el contexto ya comprimido por Ollama
      contextMessages = [
        { 
          role: 'system', 
          content: KAEDE_SYSTEM_PROMPT + '\n\n## Contexto de la conversación (resumido):\n' + compressedContext 
        }
      ];
      // El mensaje actual ya está incluido en compressedContext, pero lo agregamos explícitamente
      contextMessages.push({ role: 'user', content: message });
    } else {
      // Modo Cloud: construir contexto completo desde Supabase
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
      contextMessages = buildContext(memories ?? [], bufferMessages ?? [], maxTokens);

      // Add file content if provided
      let userMessage = message;
      if (fileContent) {
        userMessage = `[Archivo adjunto]\n\nContenido del archivo:\n${fileContent}\n\n---\n\nMensaje del usuario: ${message}`;
      }

      // Add the new user message
      contextMessages.push({ role: 'user', content: userMessage });
    }

    // SIEMPRE usar GPT-5.2 - Kaede es GPT-5.2
    return handleCloudRequest(contextMessages, model, temperature, maxTokens);
    
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Handle Cloud Mode (RouteLLM - compatible con OpenAI)
async function handleCloudRequest(
  contextMessages: Array<{ role: string; content: string }>,
  model: string,
  temperature: number,
  maxTokens: number
) {
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    console.error('OPENAI_API_KEY not configured');
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  // Usar el modelo especificado (gpt-5.2 por defecto)
  const useModel = model || 'gpt-5.2';

  const response = await fetch('https://routellm.abacus.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: useModel,
      messages: contextMessages,
      stream: true,
      max_tokens: maxTokens,
      temperature: temperature,
    }),
  });

  if (!response?.ok) {
    const error = await response?.text?.();
    console.error('RouteLLM API error:', error);
    return NextResponse.json({ error: 'Failed to get response from OpenAI' }, { status: 500 });
  }

  return streamResponse(response);
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
