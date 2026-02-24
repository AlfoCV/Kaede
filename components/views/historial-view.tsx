"use client";

import { useState } from 'react';
import { Search, Trash2, FileText, Calendar } from 'lucide-react';
import { useSavedNotes } from '@/hooks/use-supabase';
import { useSettings } from '@/hooks/use-settings';
import Modal from '@/components/modal';
import ConfirmDialog from '@/components/confirm-dialog';
import { SavedNote } from '@/lib/database.types';

export default function HistorialView() {
  const { notes, loading, deleteNote } = useSavedNotes();
  const { triggerHaptic } = useSettings();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNote, setSelectedNote] = useState<SavedNote | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const filteredNotes = notes?.filter?.(note =>
    note?.content?.toLowerCase?.()?.includes?.(searchQuery?.toLowerCase?.() ?? '') ?? false
  ) ?? [];

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteNote(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <FileText className="text-[var(--color-accent)]" size={20} />
          <span className="hidden sm:inline">Historial de </span>Notas
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 hidden sm:block">
          Mensajes guardados para referencia futura
        </p>
      </div>

      {/* Search */}
      <div className="p-3 md:p-4 border-b border-[var(--color-border)]">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" size={18} />
          <input
            type="text"
            placeholder="Buscar notas..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e?.target?.value ?? '')}
            className="w-full pl-10 pr-4 py-2 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] focus:ring-1 focus:ring-[var(--color-accent)]/30 outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-secondary)] text-sm md:text-base"
          />
        </div>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            Cargando notas...
          </div>
        ) : filteredNotes?.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="mx-auto text-[var(--color-accent-soft)] mb-3" size={48} />
            <p className="text-[var(--color-text-secondary)]">
              {searchQuery ? 'No se encontraron notas' : 'Aún no has guardado ninguna nota'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotes?.map?.((note: SavedNote) => (
              <div
                key={note?.id}
                className="bg-[var(--color-card)] rounded-xl p-3 md:p-4 shadow-sm hover:shadow-md transition-all cursor-pointer border border-[var(--color-border)] active:scale-[0.99]"
                onClick={() => {
                  triggerHaptic(30);
                  setSelectedNote(note);
                }}
              >
                <p className="text-[var(--color-text-primary)] line-clamp-3 text-sm md:text-base">
                  {note?.content ?? ''}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-[10px] md:text-xs text-[var(--color-text-secondary)] flex items-center gap-1">
                    <Calendar size={12} />
                    {formatDate(note?.created_at ?? '')}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerHaptic(30);
                      setDeleteConfirm(note?.id ?? null);
                    }}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      <Modal
        isOpen={!!selectedNote}
        onClose={() => setSelectedNote(null)}
        title="Detalle de Nota"
      >
        <div>
          <p className="text-[var(--color-text-primary)] whitespace-pre-wrap text-sm md:text-base">
            {selectedNote?.content ?? ''}
          </p>
          <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
            <span className="text-xs text-[var(--color-text-secondary)]">
              Guardada el {formatDate(selectedNote?.created_at ?? '')}
            </span>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Nota"
        message="¿Estás seguro de que quieres eliminar esta nota? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
