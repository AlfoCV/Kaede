"use client";

import { useState, useEffect } from 'react';
import { DEFAULT_SETTINGS } from '@/lib/constants';

export type AppMode = 'cloud' | 'pc';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface VoiceSettings {
  ttsEnabled: boolean;
  sttEnabled: boolean;
  voiceRate: number;
  voicePitch: number;
}

export interface Settings {
  maxTokens: number;
  temperature: number;
  hapticEnabled: boolean;
  mode: AppMode;
  theme: ThemeMode;
  cloudModel: string;
  ollamaUrl: string;
  ollamaModel: string;
  bridgeUrl: string; // URL del Kaede Bridge (ej: http://192.168.x.x:5001)
  voice: VoiceSettings;
}

const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
  ttsEnabled: false,
  sttEnabled: false,
  voiceRate: 1.1,  // Ligeramente más rápido para energía tsundere/confiada
  voicePitch: 1.15, // Más alto para vibe juvenil/anime (estilo Ukyo)
};

const FULL_DEFAULT_SETTINGS: Settings = {
  ...DEFAULT_SETTINGS,
  theme: 'light' as ThemeMode,
  voice: DEFAULT_VOICE_SETTINGS,
};

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(FULL_DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  const applyTheme = (theme: ThemeMode) => {
    if (typeof window === 'undefined') return;
    
    const root = document.documentElement;
    
    if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    } else {
      root.classList.toggle('dark', theme === 'dark');
    }
  };

  useEffect(() => {
    const saved = localStorage?.getItem?.('kaede_settings');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const merged: Settings = {
          ...FULL_DEFAULT_SETTINGS,
          ...parsed,
          voice: { ...DEFAULT_VOICE_SETTINGS, ...parsed.voice },
        };
        setSettings(merged);
        applyTheme(merged.theme);
      } catch (e) {
        console.error('Failed to parse settings:', e);
      }
    }
    setIsLoaded(true);
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      const saved = localStorage?.getItem?.('kaede_settings');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.theme === 'system') {
          applyTheme('system');
        }
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...newSettings };
      
      if (newSettings.voice && typeof newSettings.voice === 'object') {
        updated.voice = { ...prev.voice, ...newSettings.voice };
      }
      
      localStorage?.setItem?.('kaede_settings', JSON.stringify(updated));
      
      if (newSettings.theme !== undefined) {
        applyTheme(newSettings.theme);
      }
      
      return updated;
    });
  };

  const triggerHaptic = (duration: number = 50) => {
    if (settings?.hapticEnabled && typeof navigator !== 'undefined' && navigator?.vibrate) {
      navigator.vibrate(duration);
    }
  };

  const getCurrentModel = () => {
    return settings.mode === 'cloud' ? settings.cloudModel : settings.ollamaModel;
  };

  const getEffectiveTheme = (): 'light' | 'dark' => {
    if (settings.theme === 'system') {
      if (typeof window !== 'undefined') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      }
      return 'light';
    }
    return settings.theme;
  };

  return { 
    settings, 
    updateSettings, 
    triggerHaptic, 
    isLoaded, 
    getCurrentModel,
    getEffectiveTheme,
  };
}

