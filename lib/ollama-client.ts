/**
 * Cliente de Ollama para llamadas directas desde el navegador
 * Esto permite que el modo PC funcione desde cualquier deployment (Vercel, Abacus, etc.)
 * ya que la llamada se hace directamente desde tu Mac al Ollama local
 */

import { Memory, Message } from './database.types';
import { KAEDE_SYSTEM_PROMPT } from './constants';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Construye el contexto con memorias (versión cliente)
 */
export function buildClientContext(
  memories: Memory[],
  bufferMessages: Message[],
  maxTokens: number = 4000
): ChatMessage[] {
  const messages: ChatMessage[] = [];
  
  // Start with system prompt
  let systemContent = KAEDE_SYSTEM_PROMPT;
  
  // Add core memories (Nunca olvidar)
  const coreMemories = memories?.filter(m => m?.type === 'core') ?? [];
  if (coreMemories?.length > 0) {
    systemContent += '\n\n## Recuerdos Críticos (Nunca olvidar):\n';
    coreMemories.forEach(m => {
      systemContent += `- ${m?.content ?? ''}\n`;
    });
  }
  
  // Add identity memories
  const identityMemories = memories?.filter(m => m?.type === 'identity')
    ?.sort((a, b) => new Date(b?.last_used_at ?? 0).getTime() - new Date(a?.last_used_at ?? 0).getTime())
    ?.slice(0, 10) ?? [];
  if (identityMemories?.length > 0) {
    systemContent += '\n\n## Identidad y conocimientos sobre el usuario:\n';
    identityMemories.forEach(m => {
      systemContent += `- ${m?.content ?? ''}\n`;
    });
  }
  
  // Add recent experience memories
  const experienceMemories = memories?.filter(m => m?.type === 'experience')
    ?.sort((a, b) => new Date(b?.last_used_at ?? 0).getTime() - new Date(a?.last_used_at ?? 0).getTime())
    ?.slice(0, 5) ?? [];
  if (experienceMemories?.length > 0) {
    systemContent += '\n\n## Experiencias recientes:\n';
    experienceMemories.forEach(m => {
      systemContent += `- ${m?.content ?? ''}\n`;
    });
  }
  
  messages.push({ role: 'system', content: systemContent });
  
  // Add buffer messages (conversation history)
  const sortedBuffer = [...(bufferMessages ?? [])].sort(
    (a, b) => new Date(a?.created_at ?? 0).getTime() - new Date(b?.created_at ?? 0).getTime()
  );
  
  // Estimate tokens and limit if needed
  let estimatedTokens = systemContent?.length / 4;
  const maxBufferTokens = maxTokens - estimatedTokens - 500;
  
  let bufferTokens = 0;
  const messagesToInclude: Message[] = [];
  
  for (let i = sortedBuffer.length - 1; i >= 0; i--) {
    const msg = sortedBuffer[i];
    const msgTokens = (msg?.content?.length ?? 0) / 4;
    if (bufferTokens + msgTokens > maxBufferTokens) break;
    bufferTokens += msgTokens;
    messagesToInclude.unshift(msg);
  }
  
  messagesToInclude.forEach(msg => {
    if (msg?.role && msg?.content) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      });
    }
  });
  
  return messages;
}

/**
 * Verifica si Ollama está disponible localmente
 */
export async function checkOllamaAvailable(ollamaUrl: string): Promise<boolean> {
  try {
    const response = await fetch(`${ollamaUrl}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(3000), // 3 second timeout
    });
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Llama a Ollama directamente desde el navegador
 * Retorna un ReadableStream para streaming
 */
export async function callOllamaDirectly(
  ollamaUrl: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.8
): Promise<Response> {
  // Ollama tiene API compatible con OpenAI
  const response = await fetch(`${ollamaUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      stream: true,
      temperature: temperature,
    }),
  });

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Modelo '${model}' no encontrado. Descárgalo con: ollama pull ${model}`);
    }
    throw new Error('No se pudo conectar con Ollama');
  }

  return response;
}

/**
 * Procesa el stream de Ollama y retorna el contenido completo
 */
export async function processOllamaStream(
  response: Response,
  onChunk: (content: string) => void
): Promise<string> {
  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let fullContent = '';

  if (!reader) {
    throw new Error('No se pudo leer la respuesta de Ollama');
  }

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    const lines = chunk.split('\n');

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          const deltaContent = parsed?.choices?.[0]?.delta?.content ?? '';
          if (deltaContent) {
            fullContent += deltaContent;
            onChunk(fullContent);
          }
        } catch {
          // Skip invalid JSON
        }
      }
    }
  }

  return fullContent;
}
