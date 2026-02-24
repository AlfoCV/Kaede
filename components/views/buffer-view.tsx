"use client";

import { useState } from 'react';
import { Trash2, MessageCircle, Clock } from 'lucide-react';
import { useMessages } from '@/hooks/use-supabase';
import { useSettings } from '@/hooks/use-settings';
import ConfirmDialog from '@/components/confirm-dialog';
import { Message } from '@/lib/database.types';

export default function BufferView() {
  const { messages, loading, clearBuffer } = useMessages();
  const { triggerHaptic } = useSettings();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClearBuffer = async () => {
    await clearBuffer();
    setShowConfirm(false);
  };

  const formatTime = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Trash2 className="text-[var(--color-accent)]" size={20} />
          Buffer
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 hidden sm:block">
          Contexto actual de la conversación activa
        </p>
      </div>

      {/* Stats */}
      <div className="p-3 md:p-4 bg-[var(--color-accent-soft)]/10 border-b border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--color-text-secondary)]">
            <MessageCircle size={16} />
            <span>{messages?.length ?? 0} mensajes</span>
          </div>
          <button
            onClick={() => {
              triggerHaptic(30);
              setShowConfirm(true);
            }}
            disabled={(messages?.length ?? 0) === 0}
            className="px-3 md:px-4 py-1.5 md:py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 text-xs md:text-sm"
          >
            <Trash2 size={14} />
            <span className="hidden sm:inline">Limpiar</span> Buffer
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            Cargando buffer...
          </div>
        ) : (messages?.length ?? 0) === 0 ? (
          <div className="text-center py-12">
            <Trash2 className="mx-auto text-[var(--color-accent-soft)] mb-3" size={48} />
            <p className="text-[var(--color-text-secondary)]">
              El buffer está vacío
            </p>
            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
              Inicia una conversación con Kaede
            </p>
          </div>
        ) : (
          <div className="space-y-2 md:space-y-3">
            {messages?.map?.((msg: Message, index: number) => (
              <div
                key={msg?.id ?? index}
                className={`rounded-lg p-2.5 md:p-3 ${
                  msg?.role === 'user'
                    ? 'bg-[var(--color-accent-soft)]/20 ml-4 md:ml-8'
                    : 'bg-[var(--color-card)] shadow-sm border border-[var(--color-border)] mr-4 md:mr-8'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] md:text-xs font-medium ${
                    msg?.role === 'user' ? 'text-[var(--color-primary)]' : 'text-[var(--color-accent)]'
                  }`}>
                    {msg?.role === 'user' ? 'Tú' : 'Kaede'}
                  </span>
                  <span className="text-[10px] md:text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Clock size={10} />
                    {formatTime(msg?.created_at ?? '')}
                  </span>
                </div>
                <p className="text-xs md:text-sm text-[var(--color-text-primary)] line-clamp-3">
                  {msg?.content ?? ''}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 md:p-4 bg-[var(--color-surface)] border-t border-[var(--color-border)]">
        <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] text-center">
          ⚠️ Limpiar el buffer no afecta las notas ni memorias
        </p>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleClearBuffer}
        title="Limpiar Buffer"
        message="¿Estás seguro de que quieres limpiar el buffer? El historial de conversación se eliminará, pero las notas guardadas y memorias permanecerán intactas."
        confirmText="Limpiar"
        variant="warning"
      />
    </div>
  );
}
