/**
 * Cliente de Ollama para PRE-PROCESAMIENTO local
 * 
 * ARQUITECTURA HÍBRIDA:
 * - Kaede SIEMPRE es GPT-5.2 (su mente/personalidad)
 * - Ollama es solo un "cuerpo" que pre-procesa y resume contexto
 * - Esto ahorra tokens al enviar contexto comprimido a GPT-5.2
 * 
 * MODO CLOUD: Usuario → GPT-5.2 (contexto completo)
 * MODO PC:    Usuario → Ollama (resume) → GPT-5.2 (contexto comprimido)
 */

import { Memory, Message } from './database.types';

/**
 * Verifica si Ollama/Bridge está disponible
 * Si bridgeUrl está configurado, usa el bridge remoto
 * Si no, usa el API route local como proxy
 */
export async function checkOllamaAvailable(ollamaUrl: string, bridgeUrl?: string): Promise<boolean> {
  try {
    // Si hay bridge URL configurado, usarlo directamente
    const targetUrl = bridgeUrl ? `${bridgeUrl}/health` : '/api/ollama';
    
    const response = await fetch(targetUrl, {
      method: 'GET',
      headers: {
        'ngrok-skip-browser-warning': 'true',
      },
      signal: AbortSignal.timeout(5000),
    });
    
    if (response.ok) {
      const data = await response.json();
      // El bridge devuelve { status: 'ok', ollama: true/false }
      // El API route local devuelve { available: true/false }
      return data.available === true || data.ollama === true;
    }
    return false;
  } catch (error) {
    console.log('Ollama/Bridge check failed:', error);
    return false;
  }
}

/**
 * PROMPT para que Ollama resuma el contexto de conversación
 * Ollama actúa como "compresor" - extrae lo esencial para enviar a GPT-5.2
 */
const CONTEXT_COMPRESSION_PROMPT = `Eres un asistente de compresión de contexto. Tu trabajo es resumir conversaciones y memorias para optimizar tokens.

INSTRUCCIONES:
1. Resume la conversación manteniendo: nombres, fechas, decisiones, emociones clave
2. Preserva información personal del usuario (gustos, datos, contexto importante)
3. Elimina redundancias y frases de cortesía
4. Mantén el tono y contexto emocional
5. El resumen debe ser conciso pero completo

Responde SOLO con el resumen, sin explicaciones adicionales.`;

/**
 * Usa Ollama para comprimir el historial de conversación
 * Esto reduce tokens enviados a GPT-5.2
 */
export async function compressContextWithOllama(
  ollamaUrl: string,
  ollamaModel: string,
  memories: Memory[],
  recentMessages: Message[],
  currentMessage: string,
  fileContent?: string,
  bridgeUrl?: string
): Promise<{ compressedContext: string; tokensSaved: number }> {
  
  // Construir el contexto a comprimir
  let contextToCompress = '';
  
  // Agregar memorias
  const coreMemories = memories?.filter(m => m?.type === 'core') ?? [];
  const identityMemories = memories?.filter(m => m?.type === 'identity')?.slice(0, 10) ?? [];
  const experienceMemories = memories?.filter(m => m?.type === 'experience')?.slice(0, 5) ?? [];
  
  if (coreMemories.length > 0) {
    contextToCompress += '## Memorias críticas:\n';
    coreMemories.forEach(m => contextToCompress += `- ${m.content}\n`);
  }
  
  if (identityMemories.length > 0) {
    contextToCompress += '\n## Sobre el usuario:\n';
    identityMemories.forEach(m => contextToCompress += `- ${m.content}\n`);
  }
  
  if (experienceMemories.length > 0) {
    contextToCompress += '\n## Experiencias recientes:\n';
    experienceMemories.forEach(m => contextToCompress += `- ${m.content}\n`);
  }
  
  // Agregar mensajes recientes (últimos 20)
  const sortedMessages = [...(recentMessages ?? [])]
    .sort((a, b) => new Date(a.created_at ?? 0).getTime() - new Date(b.created_at ?? 0).getTime())
    .slice(-20);
  
  if (sortedMessages.length > 0) {
    contextToCompress += '\n## Conversación reciente:\n';
    sortedMessages.forEach(msg => {
      const role = msg.role === 'user' ? 'Usuario' : 'Kaede';
      // Truncar mensajes muy largos
      const content = msg.content.length > 500 ? msg.content.slice(0, 500) + '...' : msg.content;
      contextToCompress += `${role}: ${content}\n`;
    });
  }
  
  // Agregar archivo si existe
  if (fileContent) {
    const truncatedFile = fileContent.length > 2000 ? fileContent.slice(0, 2000) + '...[truncado]' : fileContent;
    contextToCompress += `\n## Archivo adjunto:\n${truncatedFile}\n`;
  }
  
  // Agregar mensaje actual
  contextToCompress += `\n## Mensaje actual del usuario:\n${currentMessage}`;
  
  const originalLength = contextToCompress.length;
  
  // Si el contexto es pequeño, no vale la pena comprimir
  if (originalLength < 1000) {
    return {
      compressedContext: contextToCompress,
      tokensSaved: 0
    };
  }
  
  try {
    // Llamar a Ollama para comprimir
    // Si hay bridge URL, usarlo; si no, usar el API route local
    const targetUrl = bridgeUrl 
      ? `${bridgeUrl}/v1/chat/completions` 
      : '/api/ollama';
    
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true' 
      },
      body: JSON.stringify({
        model: ollamaModel,
        messages: [
          { role: 'system', content: CONTEXT_COMPRESSION_PROMPT },
          { role: 'user', content: `Resume este contexto de conversación:\n\n${contextToCompress}` }
        ],
        stream: false,
        temperature: 0.3, // Baja temperatura para resumen preciso
      }),
    });

    if (!response.ok) {
      throw new Error('Ollama no respondió');
    }

    const data = await response.json();
    const compressedContext = data?.choices?.[0]?.message?.content ?? contextToCompress;
    
    const compressedLength = compressedContext.length;
    const tokensSaved = Math.round((originalLength - compressedLength) / 4); // Estimación de tokens
    
    return {
      compressedContext: compressedContext + `\n\n[Mensaje actual: ${currentMessage}]`,
      tokensSaved: Math.max(0, tokensSaved)
    };
    
  } catch (error) {
    console.error('Error comprimiendo con Ollama:', error);
    // Si falla, devolver contexto original
    return {
      compressedContext: contextToCompress,
      tokensSaved: 0
    };
  }
}
