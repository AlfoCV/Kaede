"use client";

import { useState } from 'react';
import { Network, Star, Brain, Sparkles, Plus, Trash2, Edit2 } from 'lucide-react';
import { useMemories } from '@/hooks/use-supabase';
import { useSettings } from '@/hooks/use-settings';
import ConfirmDialog from '@/components/confirm-dialog';
import Modal from '@/components/modal';
import { Memory, MemoryType } from '@/lib/database.types';

const memoryTypes: { type: MemoryType; label: string; shortLabel: string; icon: React.ReactNode; description: string }[] = [
  { type: 'core', label: 'Núcleo - Nunca olvidar', shortLabel: 'Núcleo', icon: <Star className="text-[var(--color-accent)]" size={18} />, description: 'Recuerdos críticos que siempre estarán presentes' },
  { type: 'identity', label: 'Identidad', shortLabel: 'Identidad', icon: <Brain className="text-[var(--color-primary)]" size={18} />, description: 'Información estable sobre ti' },
  { type: 'experience', label: 'Experiencias', shortLabel: 'Experiencias', icon: <Sparkles className="text-[var(--color-success)]" size={18} />, description: 'Recuerdos de conversaciones pasadas' },
];

export default function TelaranaView() {
  const { memories, loading, addMemory, updateMemory, deleteMemory } = useMemories();
  const { triggerHaptic } = useSettings();
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editingMemory, setEditingMemory] = useState<Memory | null>(null);
  const [newMemoryType, setNewMemoryType] = useState<MemoryType | null>(null);
  const [newContent, setNewContent] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editType, setEditType] = useState<MemoryType>('identity');

  const handleDelete = async () => {
    if (deleteConfirm) {
      await deleteMemory(deleteConfirm);
      setDeleteConfirm(null);
    }
  };

  const handleAddMemory = async () => {
    if (newContent?.trim() && newMemoryType) {
      const importance = newMemoryType === 'core' ? 5 : 3;
      await addMemory(newContent.trim(), newMemoryType, importance);
      setNewContent('');
      setNewMemoryType(null);
    }
  };

  const handleEditMemory = async () => {
    if (editingMemory && editContent?.trim()) {
      const importance = editType === 'core' ? 5 : editType === 'identity' ? 3 : 2;
      await updateMemory(editingMemory.id, {
        content: editContent.trim(),
        type: editType,
        importance,
      });
      setEditingMemory(null);
    }
  };

  const startEditing = (memory: Memory) => {
    setEditingMemory(memory);
    setEditContent(memory?.content ?? '');
    setEditType(memory?.type ?? 'identity');
  };

  const getMemoriesByType = (type: MemoryType) => 
    memories?.filter?.(m => m?.type === type) ?? [];

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Network className="text-[var(--color-accent)]" size={20} />
          Telaraña
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 hidden sm:block">
          Memorias estructuradas que dan contexto a las conversaciones
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-6">
        {loading ? (
          <div className="text-center py-12 text-[var(--color-text-secondary)]">
            Cargando memorias...
          </div>
        ) : (
          <div className="space-y-6 md:space-y-8">
            {memoryTypes.map(({ type, label, shortLabel, icon, description }) => (
              <div key={type}>
                <div className="flex items-center justify-between mb-2 md:mb-3">
                  <div className="flex items-center gap-2">
                    {icon}
                    <h3 className="font-semibold text-[var(--color-text-primary)] text-sm md:text-base">
                      <span className="hidden sm:inline">{label}</span>
                      <span className="sm:hidden">{shortLabel}</span>
                    </h3>
                    <span className="text-[10px] md:text-xs text-[var(--color-text-secondary)] bg-[var(--color-accent-soft)]/20 px-2 py-0.5 rounded-full">
                      {getMemoriesByType(type)?.length ?? 0}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      triggerHaptic(30);
                      setNewMemoryType(type);
                    }}
                    className="p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded-lg transition-all"
                    title="Añadir memoria"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)] mb-2 md:mb-3 hidden sm:block">{description}</p>

                {getMemoriesByType(type)?.length === 0 ? (
                  <p className="text-xs md:text-sm text-[var(--color-text-secondary)] italic py-4 text-center bg-[var(--color-accent-soft)]/10 rounded-lg">
                    Sin memorias
                  </p>
                ) : (
                  <div className="space-y-2">
                    {getMemoriesByType(type)?.map?.((memory: Memory) => (
                      <div
                        key={memory?.id}
                        className="bg-[var(--color-card)] rounded-lg p-2.5 md:p-3 shadow-sm border border-[var(--color-border)]"
                      >
                        <p className="text-[var(--color-text-primary)] text-xs md:text-sm">
                          {memory?.content ?? ''}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] md:text-xs text-[var(--color-text-secondary)]">
                            Imp: {memory?.importance ?? 0}/5
                          </span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => {
                                triggerHaptic(30);
                                startEditing(memory);
                              }}
                              className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-primary)] hover:bg-[var(--color-accent-soft)]/20 rounded transition-all"
                            >
                              <Edit2 size={14} />
                            </button>
                            <button
                              onClick={() => {
                                triggerHaptic(30);
                                setDeleteConfirm(memory?.id ?? null);
                              }}
                              className="p-1.5 text-[var(--color-text-secondary)] hover:text-[var(--color-accent)] hover:bg-[var(--color-accent)]/10 rounded transition-all"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      <Modal
        isOpen={!!newMemoryType}
        onClose={() => {
          setNewMemoryType(null);
          setNewContent('');
        }}
        title={`Añadir - ${memoryTypes?.find?.(t => t?.type === newMemoryType)?.shortLabel ?? ''}`}
      >
        <div>
          <textarea
            value={newContent}
            onChange={(e) => setNewContent(e?.target?.value ?? '')}
            placeholder="Escribe el contenido de la memoria..."
            className="w-full p-3 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none resize-none min-h-[100px] text-[var(--color-text-primary)] text-sm md:text-base"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                triggerHaptic(30);
                setNewMemoryType(null);
                setNewContent('');
              }}
              className="px-3 md:px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)]/20 rounded-lg transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                triggerHaptic(50);
                handleAddMemory();
              }}
              disabled={!newContent?.trim()}
              className="px-3 md:px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Memory Modal */}
      <Modal
        isOpen={!!editingMemory}
        onClose={() => setEditingMemory(null)}
        title="Editar Memoria"
      >
        <div>
          <div className="mb-4">
            <label className="text-sm font-medium text-[var(--color-text-primary)] mb-1 block">Tipo</label>
            <select
              value={editType}
              onChange={(e) => setEditType(e?.target?.value as MemoryType)}
              className="w-full p-2 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] text-sm md:text-base"
            >
              {memoryTypes?.map?.(t => (
                <option key={t?.type} value={t?.type}>{t?.shortLabel}</option>
              ))}
            </select>
          </div>
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e?.target?.value ?? '')}
            placeholder="Contenido de la memoria..."
            className="w-full p-3 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none resize-none min-h-[100px] text-[var(--color-text-primary)] text-sm md:text-base"
          />
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                triggerHaptic(30);
                setEditingMemory(null);
              }}
              className="px-3 md:px-4 py-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-accent-soft)]/20 rounded-lg transition-all text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={() => {
                triggerHaptic(50);
                handleEditMemory();
              }}
              disabled={!editContent?.trim()}
              className="px-3 md:px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:opacity-90 disabled:opacity-50 transition-all text-sm"
            >
              Guardar
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar Memoria"
        message="¿Estás seguro de que quieres eliminar esta memoria? Esta acción no se puede deshacer."
        confirmText="Eliminar"
        variant="danger"
      />
    </div>
  );
}
