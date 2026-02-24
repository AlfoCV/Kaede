"use client";

import { useState } from 'react';
import { Save, Star, Copy, Check, Volume2 } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';

interface MessageBubbleProps {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  onSaveNote?: (id: string, content: string) => void;
  onSaveFavorite?: (id: string, content: string) => void;
  onSpeak?: (content: string) => void;
  isSpeaking?: boolean;
}

export default function MessageBubble({
  id,
  role,
  content,
  timestamp,
  onSaveNote,
  onSaveFavorite,
  onSpeak,
  isSpeaking,
}: MessageBubbleProps) {
  const [copied, setCopied] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const [savedFavorite, setSavedFavorite] = useState(false);
  const { triggerHaptic } = useSettings();

  const isUser = role === 'user';

  const handleCopy = async () => {
    triggerHaptic(30);
    try {
      // Try modern clipboard API first
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(content);
      } else {
        // Fallback for environments where clipboard API is blocked
        const textArea = document.createElement('textarea');
        textArea.value = content;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleSaveNote = () => {
    triggerHaptic(30);
    onSaveNote?.(id, content);
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 2000);
  };

  const handleSaveFavorite = () => {
    triggerHaptic(30);
    onSaveFavorite?.(id, content);
    setSavedFavorite(true);
    setTimeout(() => setSavedFavorite(false), 2000);
  };

  const formatTime = (ts: string) => {
    try {
      return new Date(ts).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div
      className={`flex mb-4 message-enter ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-[var(--color-primary)] text-white rounded-br-md'
            : 'bg-[var(--color-surface)] text-[var(--color-text-primary)] shadow-md rounded-bl-md'
        }`}
      >
        {/* Content */}
        <div className="whitespace-pre-wrap break-words text-sm md:text-base">
          {content}
        </div>

        {/* Footer */}
        <div
          className={`flex items-center justify-between mt-2 pt-2 border-t ${
            isUser ? 'border-white/20' : 'border-[var(--color-border)]'
          }`}
        >
          <span
            className={`text-[10px] ${
              isUser ? 'text-white/60' : 'text-[var(--color-text-secondary)]'
            }`}
          >
            {formatTime(timestamp)}
          </span>

          {/* Actions for assistant messages */}
          {!isUser && id !== 'streaming' && (
            <div className="flex items-center gap-1">
              {/* Speak button */}
              {onSpeak && (
                <button
                  onClick={() => onSpeak(content)}
                  className={`p-1.5 rounded-full transition-all ${
                    isSpeaking
                      ? 'bg-[var(--color-accent)]/20 text-[var(--color-accent)]'
                      : 'hover:bg-[var(--color-accent)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
                  }`}
                  title={isSpeaking ? 'Hablando...' : 'Leer en voz alta'}
                >
                  <Volume2 size={14} className={isSpeaking ? 'animate-pulse' : ''} />
                </button>
              )}
              
              {/* Save as note */}
              <button
                onClick={handleSaveNote}
                className={`p-1.5 rounded-full transition-all ${
                  savedNote
                    ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                    : 'hover:bg-[var(--color-accent)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
                }`}
                title="Guardar como nota"
              >
                {savedNote ? <Check size={14} /> : <Save size={14} />}
              </button>

              {/* Save as memory */}
              <button
                onClick={handleSaveFavorite}
                className={`p-1.5 rounded-full transition-all ${
                  savedFavorite
                    ? 'bg-amber-100 text-amber-500'
                    : 'hover:bg-[var(--color-accent)]/10 text-[var(--color-text-secondary)] hover:text-amber-500'
                }`}
                title="Guardar como memoria"
              >
                {savedFavorite ? <Star size={14} fill="currentColor" /> : <Star size={14} />}
              </button>

              {/* Copy */}
              <button
                onClick={handleCopy}
                className={`p-1.5 rounded-full transition-all ${
                  copied
                    ? 'bg-[var(--color-success)]/20 text-[var(--color-success)]'
                    : 'hover:bg-[var(--color-accent)]/10 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)]'
                }`}
                title="Copiar"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
