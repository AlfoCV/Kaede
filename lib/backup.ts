/**
 * Backup utilities for exporting and importing memories and notes
 */

import { Memory, SavedNote } from './database.types';

export interface BackupData {
  version: string;
  exportedAt: string;
  memories: Omit<Memory, 'id'>[];
  savedNotes: Omit<SavedNote, 'id' | 'message_id'>[];
}

const BACKUP_VERSION = '1.0';

/**
 * Creates a backup object from memories and notes
 */
export function createBackup(memories: Memory[], savedNotes: SavedNote[]): BackupData {
  return {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    memories: memories.map(({ id, ...rest }) => rest),
    savedNotes: savedNotes.map(({ id, message_id, ...rest }) => rest),
  };
}

/**
 * Downloads backup as JSON file
 */
export function downloadBackup(data: BackupData): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const date = new Date().toISOString().split('T')[0];
  const filename = `kaede-backup-${date}.json`;
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Validates backup data structure
 */
export function validateBackup(data: unknown): { valid: boolean; error?: string; data?: BackupData } {
  if (!data || typeof data !== 'object') {
    return { valid: false, error: 'Archivo inválido: no es un objeto JSON' };
  }
  
  const backup = data as Record<string, unknown>;
  
  if (!backup.version || typeof backup.version !== 'string') {
    return { valid: false, error: 'Archivo inválido: falta versión' };
  }
  
  if (!backup.exportedAt || typeof backup.exportedAt !== 'string') {
    return { valid: false, error: 'Archivo inválido: falta fecha de exportación' };
  }
  
  if (!Array.isArray(backup.memories)) {
    return { valid: false, error: 'Archivo inválido: memorias deben ser un arreglo' };
  }
  
  if (!Array.isArray(backup.savedNotes)) {
    return { valid: false, error: 'Archivo inválido: notas deben ser un arreglo' };
  }
  
  // Validate memory structure
  for (const memory of backup.memories as Record<string, unknown>[]) {
    if (!memory.content || typeof memory.content !== 'string') {
      return { valid: false, error: 'Memoria inválida: falta contenido' };
    }
    if (!memory.type || !['core', 'identity', 'experience'].includes(memory.type as string)) {
      return { valid: false, error: 'Memoria inválida: tipo incorrecto' };
    }
  }
  
  // Validate note structure
  for (const note of backup.savedNotes as Record<string, unknown>[]) {
    if (!note.content || typeof note.content !== 'string') {
      return { valid: false, error: 'Nota inválida: falta contenido' };
    }
  }
  
  return { 
    valid: true, 
    data: {
      version: backup.version as string,
      exportedAt: backup.exportedAt as string,
      memories: backup.memories as Omit<Memory, 'id'>[],
      savedNotes: backup.savedNotes as Omit<SavedNote, 'id' | 'message_id'>[],
    } 
  };
}

/**
 * Reads a file and parses as JSON
 */
export function readBackupFile(file: File): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        resolve(json);
      } catch {
        reject(new Error('No se pudo parsear el archivo JSON'));
      }
    };
    reader.onerror = () => reject(new Error('Error leyendo archivo'));
    reader.readAsText(file);
  });
}
