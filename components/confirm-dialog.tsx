"use client";

import { AlertTriangle } from 'lucide-react';
import Modal from './modal';
import { useSettings } from '@/hooks/use-settings';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning';
}

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
}: ConfirmDialogProps) {
  const { triggerHaptic } = useSettings();

  const handleConfirm = () => {
    triggerHaptic(50);
    onConfirm();
  };

  const handleCancel = () => {
    triggerHaptic(30);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center">
        <div className={`w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center ${
          variant === 'danger' ? 'bg-[var(--color-accent)]/10' : 'bg-amber-100 dark:bg-amber-900/20'
        }`}>
          <AlertTriangle className={variant === 'danger' ? 'text-[var(--color-accent)]' : 'text-amber-500'} size={24} />
        </div>
        <p className="text-[var(--color-text-primary)] mb-6">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 px-4 py-2 border border-[var(--color-border)] text-[var(--color-text-secondary)] rounded-lg hover:bg-[var(--color-accent-soft)]/10 transition-all"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className={`flex-1 px-4 py-2 text-white rounded-lg transition-all ${
              variant === 'danger' 
                ? 'bg-[var(--color-accent)] hover:opacity-90' 
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
