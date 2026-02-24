"use client";

import { useState, useRef, useEffect } from 'react';
import MessageBubble from '@/components/message-bubble';
import ChatInput from '@/components/chat-input';
import TypingIndicator from '@/components/typing-indicator';
import { useMessages, useSavedNotes, useMemories, resetTableCheck } from '@/hooks/use-supabase';
import { useSettings } from '@/hooks/use-settings';
import { useVoice } from '@/hooks/use-voice';
import { Message } from '@/lib/database.types';
import { AlertCircle, ExternalLink, RefreshCw, Cloud, Monitor, Volume2, VolumeX } from 'lucide-react';

export default function ChatView() {
  const { messages, addMessage, error } = useMessages();
  const { saveNote } = useSavedNotes();
  const { addMemory } = useMemories();
  const { settings, getCurrentModel, isLoaded, triggerHaptic } = useSettings();
  const { speak, stopSpeaking, isSpeaking, ttsSupported } = useVoice();
  const [isTyping, setIsTyping] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef?.current?.scrollIntoView?.({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  const handleSendMessage = async (content: string, fileContent?: string) => {
    // Stop any ongoing speech
    if (isSpeaking) {
      stopSpeaking();
    }

    // Add user message (with file indicator if attached)
    const displayContent = fileContent ? `${content}\n\n📎 Archivo adjunto` : content;
    await addMessage('user', displayContent);
    setIsTyping(true);
    setStreamingContent('');

    try {
      const currentModel = getCurrentModel();
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          maxTokens: settings.maxTokens,
          temperature: settings.temperature,
          model: currentModel,
          mode: settings.mode,
          ollamaUrl: settings.ollamaUrl,
          fileContent: fileContent,
        }),
      });

      // Handle non-streaming error responses
      if (!response?.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Error desconocido' }));
        throw new Error(errorData.error || 'Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      if (reader) {
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
                  setStreamingContent(fullContent);
                }
              } catch {
                // Skip invalid JSON
              }
            }
          }
        }
      }

      // Add assistant message to database
      if (fullContent) {
        await addMessage('assistant', fullContent);
        
        // Auto TTS if enabled
        if (settings.voice?.ttsEnabled && ttsSupported) {
          // Clean content for speech (remove emojis and special chars)
          const cleanContent = fullContent
            .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
            .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
            .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
            .replace(/[\u{2600}-\u{26FF}]/gu, '')
            .replace(/```[\s\S]*?```/g, 'bloque de código')
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/\*(.*?)\*/g, '$1')
            .trim();
          
          if (cleanContent) {
            speak(cleanContent);
          }
        }
      }
    } catch (err: unknown) {
      console.error('Chat error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      
      let displayError = errorMessage;
      if (settings.mode === 'pc' && (errorMessage.includes('Ollama') || errorMessage.includes('conectar'))) {
        displayError = `💻 ${errorMessage}\n\n¿Necesitas ayuda? Ve a Ajustes para ver las instrucciones de configuración de Ollama.`;
      } else {
        displayError = `Lo siento, hubo un error: ${errorMessage} 😔`;
      }
      
      await addMessage('assistant', displayError);
    } finally {
      setIsTyping(false);
      setStreamingContent('');
    }
  };

  const handleSaveNote = async (messageId: string, content: string) => {
    await saveNote(messageId, content);
  };

  const handleSaveFavorite = async (messageId: string, content: string) => {
    await addMemory(content, 'identity', 3);
  };

  const handleSpeakMessage = (content: string) => {
    triggerHaptic(30);
    if (isSpeaking) {
      stopSpeaking();
    } else {
      const cleanContent = content
        .replace(/[\u{1F600}-\u{1F64F}]/gu, '')
        .replace(/[\u{1F300}-\u{1F5FF}]/gu, '')
        .replace(/[\u{1F680}-\u{1F6FF}]/gu, '')
        .replace(/[\u{2600}-\u{26FF}]/gu, '')
        .replace(/```[\s\S]*?```/g, 'bloque de código')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .trim();
      speak(cleanContent);
    }
  };

  const displayMessages = [...(messages ?? [])];

  // Mode indicator info
  const modeInfo = isLoaded && settings.mode === 'pc'
    ? { icon: Monitor, label: 'PC', color: 'text-blue-500', bgColor: 'bg-blue-500/10', dotColor: 'bg-blue-500' }
    : { icon: Cloud, label: 'Nube', color: 'text-[var(--color-success)]', bgColor: 'bg-[var(--color-success)]/10', dotColor: 'bg-[var(--color-success)]' };

  // Show setup instructions if tables don't exist
  if (error === 'tables_not_created') {
    return (
      <div className="flex flex-col h-full bg-[var(--color-background)]">
        <div className="p-6 border-b border-[var(--color-border)]">
          <h2 className="text-xl font-poppins font-semibold text-[var(--color-text-primary)]">
            Configuración Requerida
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="max-w-lg bg-[var(--color-card)] rounded-2xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-[var(--color-accent)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="text-[var(--color-accent)]" size={32} />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              Base de datos no configurada
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-4">
              Las tablas necesarias aún no existen en Supabase. Por favor, ejecuta el siguiente SQL en el Editor SQL de tu proyecto Supabase:
            </p>
            <div className="bg-[var(--color-primary)] rounded-lg p-4 text-left mb-4 overflow-x-auto">
              <code className="text-xs text-[var(--color-accent-soft)] whitespace-pre">
{`-- Copia este SQL en Supabase SQL Editor

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_in_buffer BOOLEAN DEFAULT true
);

CREATE TABLE saved_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  message_id UUID,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL DEFAULT 'default_user',
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  importance INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ DEFAULT NOW(),
  access_count INTEGER DEFAULT 0
);`}
              </code>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://supabase.com/dashboard/project/gjdzqqfovrxtwraflwtn/sql/new"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 transition-all"
              >
                <ExternalLink size={16} />
                Abrir Supabase SQL Editor
              </a>
              <button
                onClick={() => {
                  resetTableCheck();
                  window.location.reload();
                }}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-all"
              >
                <RefreshCw size={16} />
                Reintentar conexión
              </button>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] mt-4">
              Después de ejecutar el SQL, haz clic en &quot;Reintentar conexión&quot;.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[var(--color-background)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--color-border)] flex items-center justify-between">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-[var(--color-text-primary)]">
          Conversa con Kaede
        </h2>
        <div className="flex items-center gap-2">
          {/* TTS indicator */}
          {settings.voice?.ttsEnabled && ttsSupported && (
            <button
              onClick={() => {
                triggerHaptic(30);
                if (isSpeaking) stopSpeaking();
              }}
              className={`p-2 rounded-full transition-all ${
                isSpeaking 
                  ? 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]' 
                  : 'text-[var(--color-text-secondary)]'
              }`}
              title={isSpeaking ? 'Detener voz' : 'Voz activada'}
            >
              {isSpeaking ? <Volume2 size={18} className="animate-pulse" /> : <VolumeX size={18} />}
            </button>
          )}
          {/* Mode badge */}
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full ${modeInfo.bgColor}`}>
            <span className={`w-2 h-2 rounded-full ${modeInfo.dotColor} animate-pulse`}></span>
            <modeInfo.icon size={14} className={modeInfo.color} />
            <span className={`text-xs font-medium ${modeInfo.color}`}>{modeInfo.label}</span>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-28 md:pb-24">
        {displayMessages?.length === 0 && !isTyping && (
          <div className="text-center py-12">
            <p className="text-[var(--color-text-secondary)]">
              ¡Hola! Soy Kaede. ¿En qué puedo ayudarte hoy? 💙
            </p>
            {settings.mode === 'pc' && (
              <p className="text-xs text-[var(--color-text-secondary)]/60 mt-2">
                Conectada a Ollama ({settings.ollamaModel})
              </p>
            )}
            {settings.voice?.ttsEnabled && (
              <p className="text-xs text-[var(--color-accent)] mt-2">
                🔊 Voz activada
              </p>
            )}
          </div>
        )}

        {displayMessages?.map?.((msg: Message) => (
          <MessageBubble
            key={msg?.id}
            id={msg?.id ?? ''}
            role={msg?.role ?? 'user'}
            content={msg?.content ?? ''}
            timestamp={msg?.created_at ?? ''}
            onSaveNote={handleSaveNote}
            onSaveFavorite={handleSaveFavorite}
            onSpeak={settings.voice?.ttsEnabled && ttsSupported ? handleSpeakMessage : undefined}
            isSpeaking={isSpeaking}
          />
        ))}

        {/* Streaming message */}
        {streamingContent && (
          <MessageBubble
            id="streaming"
            role="assistant"
            content={streamingContent}
            timestamp={new Date().toISOString()}
          />
        )}

        {/* Typing indicator */}
        {isTyping && !streamingContent && (
          <div className="flex justify-start mb-4">
            <div className="bg-[var(--color-surface)] rounded-2xl px-4 py-3 shadow-md">
              <TypingIndicator />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={handleSendMessage} disabled={isTyping} />
    </div>
  );
}
