"use client";

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Mic, MicOff, X, FileText, Image as ImageIcon, File, StopCircle } from 'lucide-react';
import { useSettings } from '@/hooks/use-settings';
import { useVoice } from '@/hooks/use-voice';

interface FileAttachment {
  name: string;
  type: string;
  content: string;
  size: number;
}

interface ChatInputProps {
  onSend: (message: string, fileContent?: string) => void;
  disabled?: boolean;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [attachment, setAttachment] = useState<FileAttachment | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { settings, triggerHaptic } = useSettings();
  const {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    sttSupported,
  } = useVoice();

  // Update message when transcript changes
  useEffect(() => {
    if (transcript) {
      setMessage((prev) => prev + transcript);
      resetTranscript();
    }
  }, [transcript, resetTranscript]);

  const handleSubmit = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && !attachment) return;
    
    triggerHaptic(50);
    onSend(trimmedMessage || 'Analiza este archivo', attachment?.content);
    setMessage('');
    setAttachment(null);
    
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    // Auto-resize
    const textarea = e.target;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset input
    e.target.value = '';

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      alert('El archivo es demasiado grande. Máximo 5MB.');
      return;
    }

    setIsProcessingFile(true);
    triggerHaptic(30);

    try {
      let content = '';

      if (file.type === 'application/pdf') {
        content = `[Este es un archivo PDF: ${file.name}]\n\nNota: El procesamiento de PDFs requiere extracción de texto. Por favor, copia el contenido del PDF y pégalo directamente en el chat para mejor procesamiento.`;
      } else if (file.type.startsWith('image/')) {
        content = await readFileAsDataURL(file);
        content = `[Imagen adjunta: ${file.name}]\n\n${content}`;
      } else {
        content = await readFileAsText(file);
      }

      setAttachment({
        name: file.name,
        type: file.type,
        content,
        size: file.size,
      });
    } catch (error) {
      console.error('Error reading file:', error);
      alert('Error al leer el archivo.');
    }

    setIsProcessingFile(false);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const readFileAsDataURL = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = () => {
    triggerHaptic(30);
    setAttachment(null);
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return ImageIcon;
    if (type === 'application/pdf' || type.includes('text')) return FileText;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleVoiceToggle = () => {
    triggerHaptic(30);
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const voiceEnabled = settings.voice?.sttEnabled && sttSupported;

  return (
    <div className="p-3 md:p-4 border-t border-[var(--color-border)] bg-[var(--color-background)]">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-3 p-3 bg-[var(--color-card)] rounded-lg border border-[var(--color-border)] flex items-center gap-3">
          {(() => {
            const FileIcon = getFileIcon(attachment.type);
            return <FileIcon size={20} className="text-[var(--color-accent)]" />;
          })()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{attachment.name}</p>
            <p className="text-xs text-[var(--color-text-secondary)]">{formatFileSize(attachment.size)}</p>
          </div>
          <button
            onClick={removeAttachment}
            className="p-1.5 hover:bg-[var(--color-accent)]/10 rounded-full transition-colors"
          >
            <X size={16} className="text-[var(--color-text-secondary)]" />
          </button>
        </div>
      )}

      {/* Listening Indicator */}
      {isListening && (
        <div className="mb-3 p-3 bg-[var(--color-accent)]/10 rounded-lg border border-[var(--color-accent)]/30 flex items-center gap-3">
          <div className="w-3 h-3 bg-[var(--color-accent)] rounded-full recording-pulse" />
          <p className="text-sm text-[var(--color-accent)] font-medium">Escuchando... habla ahora</p>
          <button
            onClick={stopListening}
            className="ml-auto p-1.5 bg-[var(--color-accent)] text-white rounded-full hover:opacity-90"
          >
            <StopCircle size={16} />
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="flex items-end gap-2">
        {/* File Attachment Button */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.csv,.json,.html,.css,.js,.py,.pdf,image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        <button
          onClick={() => {
            triggerHaptic(30);
            fileInputRef.current?.click();
          }}
          disabled={disabled || isProcessingFile}
          className="flex-shrink-0 p-2.5 md:p-3 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-full transition-all disabled:opacity-50"
          title="Adjuntar archivo"
        >
          <Paperclip size={20} className={isProcessingFile ? 'animate-pulse' : ''} />
        </button>

        {/* Text Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={attachment ? 'Añade un mensaje (opcional)...' : isListening ? 'Escuchando...' : 'Escribe un mensaje...'}
            disabled={disabled}
            rows={1}
            className="w-full px-4 py-2.5 md:py-3 bg-[var(--color-input-bg)] rounded-2xl border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none resize-none text-[var(--color-text-primary)] text-sm md:text-base placeholder:text-[var(--color-text-secondary)]/60 disabled:opacity-50"
            style={{ maxHeight: '150px' }}
          />
        </div>

        {/* Voice Button */}
        {voiceEnabled && (
          <button
            onClick={handleVoiceToggle}
            disabled={disabled}
            className={`flex-shrink-0 p-2.5 md:p-3 rounded-full transition-all disabled:opacity-50 ${
              isListening
                ? 'bg-[var(--color-accent)] text-white recording-pulse'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10'
            }`}
            title={isListening ? 'Detener grabación' : 'Mensaje de voz'}
          >
            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}

        {/* Send Button */}
        <button
          onClick={handleSubmit}
          disabled={disabled || (!message.trim() && !attachment)}
          className="flex-shrink-0 p-2.5 md:p-3 bg-[var(--color-accent)] text-white rounded-full hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send size={20} />
        </button>
      </div>

      {/* Hints */}
      <p className="text-[10px] text-[var(--color-text-secondary)]/60 mt-2 text-center">
        {voiceEnabled 
          ? 'Archivos: TXT, MD, CSV, JSON, HTML, CSS, JS, PY, PDF, Imágenes • 🎤 Voz activada'
          : 'Archivos: TXT, MD, CSV, JSON, HTML, CSS, JS, PY, PDF, Imágenes (máx 5MB)'
        }
      </p>
    </div>
  );
}
