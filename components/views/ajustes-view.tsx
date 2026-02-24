"use client";

import { Settings, Cloud, Monitor, Sliders, Zap, ExternalLink, Server, Wifi, WifiOff, RefreshCw, Sun, Moon, Laptop, Mic, Volume2, Download, FileDown, FileUp } from 'lucide-react';
import { useSettings, AppMode, ThemeMode } from '@/hooks/use-settings';
import { CLOUD_MODELS, OLLAMA_MODELS } from '@/lib/constants';
import { useState, useEffect, useRef } from 'react';
import { useMemories, useSavedNotes } from '@/hooks/use-supabase';
import { createBackup, downloadBackup, validateBackup, readBackupFile } from '@/lib/backup';
import { MemoryType } from '@/lib/database.types';

export default function AjustesView() {
  const { settings, updateSettings, triggerHaptic, isLoaded, getEffectiveTheme } = useSettings();
  const { memories, addMemory } = useMemories();
  const { notes, saveNote } = useSavedNotes();
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'disconnected'>('checking');
  const [checkingOllama, setCheckingOllama] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Check Ollama/Bridge connection status
  const checkOllamaConnection = async () => {
    setCheckingOllama(true);
    try {
      // Si hay bridge URL configurado, verificar el bridge; si no, verificar Ollama directo
      const targetUrl = settings.bridgeUrl 
        ? `${settings.bridgeUrl}/health`
        : `${settings.ollamaUrl}/api/tags`;
      
      const response = await fetch(targetUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        const data = await response.json();
        // El bridge devuelve { ollama: true/false }
        if (settings.bridgeUrl) {
          setOllamaStatus(data.ollama ? 'connected' : 'disconnected');
        } else {
          setOllamaStatus('connected');
        }
      } else {
        setOllamaStatus('disconnected');
      }
    } catch {
      setOllamaStatus('disconnected');
    }
    setCheckingOllama(false);
  };

  useEffect(() => {
    if (isLoaded && settings.mode === 'pc') {
      checkOllamaConnection();
    }
  }, [isLoaded, settings.mode, settings.ollamaUrl, settings.bridgeUrl]);

  // Export backup
  const handleExport = () => {
    triggerHaptic(50);
    const backup = createBackup(memories, notes);
    downloadBackup(backup);
  };

  // Import backup
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';

    setImporting(true);
    setImportResult(null);
    triggerHaptic(30);

    try {
      const jsonData = await readBackupFile(file);
      const validation = validateBackup(jsonData);

      if (!validation.valid || !validation.data) {
        setImportResult({ success: false, message: validation.error || 'Error desconocido' });
        setImporting(false);
        return;
      }

      const backup = validation.data;
      let memoriesAdded = 0;
      let notesAdded = 0;

      // Import memories
      for (const memory of backup.memories) {
        await addMemory(
          memory.content,
          memory.type as MemoryType,
          memory.importance || 5
        );
        memoriesAdded++;
      }

      // Import notes - saveNote expects content only for new notes
      for (const note of backup.savedNotes) {
        await saveNote(null, note.content);
        notesAdded++;
      }

      setImportResult({
        success: true,
        message: `Importado: ${memoriesAdded} memorias, ${notesAdded} notas`,
      });
    } catch (error) {
      console.error('Import error:', error);
      setImportResult({
        success: false,
        message: error instanceof Error ? error.message : 'Error al importar',
      });
    }

    setImporting(false);
  };

  if (!isLoaded) {
    return (
      <div className="h-full flex items-center justify-center bg-[var(--color-background)]">
        <p className="text-[var(--color-text-secondary)]">Cargando ajustes...</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-[var(--color-background)]">
      {/* Header */}
      <div className="p-4 md:p-6 border-b border-[var(--color-border)]">
        <h2 className="text-lg md:text-xl font-poppins font-semibold text-[var(--color-text-primary)] flex items-center gap-2">
          <Settings className="text-[var(--color-accent)]" size={20} />
          Ajustes
        </h2>
        <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 hidden sm:block">
          Configura el comportamiento de Kaede
        </p>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        <div className="max-w-md space-y-6 md:space-y-8">
          
          {/* Theme Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-[var(--color-text-primary)] mb-3">
              {getEffectiveTheme() === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
              Tema
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: 'light' as ThemeMode, icon: Sun, label: 'Claro' },
                { value: 'dark' as ThemeMode, icon: Moon, label: 'Oscuro' },
                { value: 'system' as ThemeMode, icon: Laptop, label: 'Sistema' },
              ].map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => {
                    triggerHaptic(30);
                    updateSettings({ theme: value });
                  }}
                  className={`p-3 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                    settings.theme === value
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                      : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent-soft)]'
                  }`}
                >
                  <Icon size={20} className={settings.theme === value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'} />
                  <span className={`text-xs font-medium ${settings.theme === value ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selection */}
          <div>
            <label className="flex items-center gap-2 text-xs md:text-sm font-medium text-[var(--color-text-primary)] mb-3">
              <Server size={16} />
              Modo de Conexión
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => {
                  triggerHaptic(30);
                  updateSettings({ mode: 'cloud' as AppMode });
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  settings.mode === 'cloud'
                    ? 'border-[var(--color-accent)] bg-[var(--color-accent)]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent-soft)]'
                }`}
              >
                <Cloud className={`mx-auto mb-2 ${settings.mode === 'cloud' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-secondary)]'}`} size={28} />
                <p className={`text-sm font-medium ${settings.mode === 'cloud' ? 'text-[var(--color-accent)]' : 'text-[var(--color-text-primary)]'}`}>
                  ☁️ Nube
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">OpenAI / Claude</p>
              </button>
              <button
                onClick={() => {
                  triggerHaptic(30);
                  updateSettings({ mode: 'pc' as AppMode });
                  setTimeout(checkOllamaConnection, 100);
                }}
                className={`p-4 rounded-xl border-2 transition-all ${
                  settings.mode === 'pc'
                    ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10'
                    : 'border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-accent-soft)]'
                }`}
              >
                <Monitor className={`mx-auto mb-2 ${settings.mode === 'pc' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-secondary)]'}`} size={28} />
                <p className={`text-sm font-medium ${settings.mode === 'pc' ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-primary)]'}`}>
                  🖥️ PC
                </p>
                <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">Ollama Local</p>
              </button>
            </div>
          </div>

          {/* PC Mode Settings */}
          {settings.mode === 'pc' && (
            <div className="space-y-4 p-4 bg-[var(--color-primary)]/5 rounded-xl border border-[var(--color-primary)]/20">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-[var(--color-primary)] flex items-center gap-2">
                  <Monitor size={16} />
                  Configuración Ollama
                </h3>
                <div className="flex items-center gap-2">
                  {ollamaStatus === 'connected' && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-success)]">
                      <Wifi size={14} /> Conectado
                    </span>
                  )}
                  {ollamaStatus === 'disconnected' && (
                    <span className="flex items-center gap-1 text-xs text-[var(--color-accent)]">
                      <WifiOff size={14} /> Desconectado
                    </span>
                  )}
                  <button
                    onClick={() => {
                      triggerHaptic(30);
                      checkOllamaConnection();
                    }}
                    disabled={checkingOllama}
                    className="p-1.5 hover:bg-[var(--color-primary)]/10 rounded-lg transition-colors"
                  >
                    <RefreshCw size={14} className={`text-[var(--color-primary)] ${checkingOllama ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">URL de Ollama</label>
                <input
                  type="text"
                  value={settings.ollamaUrl}
                  onChange={(e) => updateSettings({ ollamaUrl: e.target.value })}
                  placeholder="http://localhost:11434"
                  className="w-full p-2.5 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-[var(--color-text-primary)] text-sm font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Modelo</label>
                <select
                  value={settings.ollamaModel}
                  onChange={(e) => {
                    triggerHaptic(30);
                    updateSettings({ ollamaModel: e.target.value });
                  }}
                  className="w-full p-2.5 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-[var(--color-text-primary)] text-sm"
                >
                  {OLLAMA_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">
                  Bridge URL <span className="text-[var(--color-text-secondary)]/60">(opcional)</span>
                </label>
                <input
                  type="text"
                  value={settings.bridgeUrl || ''}
                  onChange={(e) => updateSettings({ bridgeUrl: e.target.value })}
                  placeholder="http://192.168.x.x:5001"
                  className="w-full p-2.5 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-primary)] outline-none text-[var(--color-text-primary)] text-sm font-mono"
                />
                <p className="text-[10px] text-[var(--color-text-secondary)]/70 mt-1">
                  Para conectar desde Vercel a tu Mac. Corre <code className="bg-[var(--color-input-bg)] px-1 rounded">kaede-bridge</code> en tu Mac.
                </p>
              </div>

              {ollamaStatus === 'disconnected' && (
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
                  <p className="text-xs text-amber-800 dark:text-amber-200 font-medium mb-2">Para usar Modo PC:</p>
                  <ol className="text-[10px] text-amber-700 dark:text-amber-300 space-y-1 list-decimal list-inside">
                    <li>Instala Ollama: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">brew install ollama</code></li>
                    <li>Inicia el servidor: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">ollama serve</code></li>
                    <li>Descarga un modelo: <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">ollama pull {settings.ollamaModel}</code></li>
                  </ol>
                </div>
              )}
            </div>
          )}

          {/* Cloud Mode Settings */}
          {settings.mode === 'cloud' && (
            <div className="space-y-4 p-4 bg-[var(--color-accent)]/5 rounded-xl border border-[var(--color-accent)]/20">
              <h3 className="text-sm font-medium text-[var(--color-accent)] flex items-center gap-2">
                <Cloud size={16} />
                Configuración Nube
              </h3>
              
              <div>
                <label className="text-xs text-[var(--color-text-secondary)] mb-1 block">Modelo</label>
                <select
                  value={settings.cloudModel}
                  onChange={(e) => {
                    triggerHaptic(30);
                    updateSettings({ cloudModel: e.target.value });
                  }}
                  className="w-full p-2.5 bg-[var(--color-input-bg)] rounded-lg border border-[var(--color-border)] focus:border-[var(--color-accent)] outline-none text-[var(--color-text-primary)] text-sm"
                >
                  {CLOUD_MODELS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {m.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Voice Settings */}
          <div className="space-y-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
              <Mic size={16} className="text-[var(--color-accent)]" />
              Voz
              <span className="text-[10px] px-2 py-0.5 bg-[var(--color-success)]/20 text-[var(--color-success)] rounded-full">Gratis</span>
            </h3>

            {/* STT Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
                  <Mic size={16} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Entrada por voz</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Habla en lugar de escribir</p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(50);
                  updateSettings({ voice: { ...settings.voice, sttEnabled: !settings.voice.sttEnabled } });
                }}
                className={`w-11 h-6 rounded-full transition-all ${
                  settings.voice.sttEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-accent-soft)]/40'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.voice.sttEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* TTS Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
                  <Volume2 size={16} className="text-[var(--color-accent)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">Respuestas habladas</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)]">Kaede lee sus respuestas</p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(50);
                  updateSettings({ voice: { ...settings.voice, ttsEnabled: !settings.voice.ttsEnabled } });
                }}
                className={`w-11 h-6 rounded-full transition-all ${
                  settings.voice.ttsEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-accent-soft)]/40'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.voice.ttsEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* Voice Rate */}
            {settings.voice.ttsEnabled && (
              <div>
                <label className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] mb-2">
                  <span>Velocidad de voz</span>
                  <span className="text-[var(--color-accent)]">{settings.voice.voiceRate.toFixed(1)}x</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.voice.voiceRate}
                  onChange={(e) => {
                    updateSettings({ voice: { ...settings.voice, voiceRate: parseFloat(e.target.value) } });
                  }}
                  className="w-full h-2 bg-[var(--color-accent-soft)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
                />
              </div>
            )}
          </div>

          {/* General Settings */}
          <div className="space-y-6">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
              <Sliders size={16} />
              Ajustes Generales
            </h3>

            <div>
              <label className="flex items-center justify-between text-xs md:text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <span>Tokens Máximos</span>
                <span className="text-[var(--color-accent)]">{settings.maxTokens}</span>
              </label>
              <input
                type="range"
                min="500"
                max="4000"
                step="100"
                value={settings.maxTokens}
                onChange={(e) => {
                  triggerHaptic(10);
                  updateSettings({ maxTokens: parseInt(e.target.value) });
                }}
                className="w-full h-2 bg-[var(--color-accent-soft)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
            </div>

            <div>
              <label className="flex items-center justify-between text-xs md:text-sm font-medium text-[var(--color-text-primary)] mb-2">
                <span>Temperatura</span>
                <span className="text-[var(--color-accent)]">{settings.temperature.toFixed(1)}</span>
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={settings.temperature}
                onChange={(e) => {
                  triggerHaptic(10);
                  updateSettings({ temperature: parseFloat(e.target.value) });
                }}
                className="w-full h-2 bg-[var(--color-accent-soft)]/30 rounded-lg appearance-none cursor-pointer accent-[var(--color-accent)]"
              />
              <div className="flex justify-between text-[10px] text-[var(--color-text-secondary)] mt-1">
                <span>Preciso</span>
                <span>Creativo</span>
              </div>
            </div>
          </div>

          {/* Haptic Feedback */}
          <div className="bg-[var(--color-card)] rounded-xl p-3 md:p-4 shadow-sm border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-[var(--color-accent)]/10 rounded-lg">
                  <Zap className="text-[var(--color-accent)]" size={18} />
                </div>
                <div>
                  <h3 className="font-medium text-[var(--color-text-primary)] text-sm md:text-base">Vibración</h3>
                  <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)]">Feedback táctil</p>
                </div>
              </div>
              <button
                onClick={() => {
                  triggerHaptic(50);
                  updateSettings({ hapticEnabled: !settings.hapticEnabled });
                }}
                className={`w-11 md:w-12 h-6 rounded-full transition-all ${
                  settings.hapticEnabled ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-accent-soft)]/40'
                }`}
              >
                <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  settings.hapticEnabled ? 'translate-x-5 md:translate-x-6' : 'translate-x-0.5'
                }`} />
              </button>
            </div>
          </div>

          {/* Backup / Export / Import */}
          <div className="space-y-4 p-4 bg-[var(--color-card)] rounded-xl border border-[var(--color-border)]">
            <h3 className="text-sm font-medium text-[var(--color-text-primary)] flex items-center gap-2">
              <Download size={16} className="text-[var(--color-accent)]" />
              Backup
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-success)]/10 text-[var(--color-success)] rounded-lg hover:bg-[var(--color-success)]/20 transition-all text-sm font-medium"
              >
                <FileDown size={18} />
                Exportar
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImport}
                className="hidden"
              />
              <button
                onClick={() => {
                  triggerHaptic(30);
                  fileInputRef.current?.click();
                }}
                disabled={importing}
                className="flex items-center justify-center gap-2 p-3 bg-[var(--color-accent-soft)]/20 text-[var(--color-primary)] rounded-lg hover:bg-[var(--color-accent-soft)]/30 transition-all text-sm font-medium disabled:opacity-50"
              >
                <FileUp size={18} className={importing ? 'animate-pulse' : ''} />
                Importar
              </button>
            </div>

            {importResult && (
              <p className={`text-xs p-2 rounded-lg ${
                importResult.success 
                  ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' 
                  : 'bg-[var(--color-accent)]/10 text-[var(--color-accent)]'
              }`}>
                {importResult.message}
              </p>
            )}

            <p className="text-[10px] text-[var(--color-text-secondary)]">
              Exporta/importa tus memorias y notas guardadas como archivo JSON.
            </p>
          </div>

          {/* External Links */}
          {settings.mode === 'cloud' && (
            <div>
              <a
                href="https://platform.openai.com/settings/organization/billing/overview"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2.5 md:p-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-all text-sm md:text-base"
                onClick={() => triggerHaptic(30)}
              >
                <ExternalLink size={18} />
                Ver créditos en OpenAI
              </a>
            </div>
          )}

          {settings.mode === 'pc' && (
            <div>
              <a
                href="https://ollama.ai/library"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full p-2.5 md:p-3 bg-[var(--color-primary)] text-white rounded-lg hover:opacity-90 transition-all text-sm md:text-base"
                onClick={() => triggerHaptic(30)}
              >
                <ExternalLink size={18} />
                Ver modelos de Ollama
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 md:p-4 border-t border-[var(--color-border)] text-center">
        <p className="text-[10px] md:text-xs text-[var(--color-text-secondary)]">
          Kaede v3.0 • Fase 3: {settings.mode === 'cloud' ? 'Modo Nube' : 'Modo PC'} • {getEffectiveTheme() === 'dark' ? '🌙' : '☀️'}
        </p>
      </div>
    </div>
  );
}
