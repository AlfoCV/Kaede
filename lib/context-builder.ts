import { Memory, Message } from './database.types';
import { KAEDE_SYSTEM_PROMPT } from './constants';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export function buildContext(
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
  const maxBufferTokens = maxTokens - estimatedTokens - 500; // Leave room for response
  
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
