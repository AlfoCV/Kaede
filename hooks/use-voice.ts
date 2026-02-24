"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSettings } from './use-settings';

// Type declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionInterface extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionInterface;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

interface UseVoiceReturn {
  isListening: boolean;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  sttSupported: boolean;
  isSpeaking: boolean;
  speak: (text: string) => void;
  stopSpeaking: () => void;
  ttsSupported: boolean;
  voices: SpeechSynthesisVoice[];
}

export function useVoice(): UseVoiceReturn {
  const { settings, triggerHaptic } = useSettings();
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [sttSupported, setSttSupported] = useState(false);
  const [ttsSupported, setTtsSupported] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognitionInterface | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check STT support
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionClass) {
      setSttSupported(true);
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'es-MX';
      
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
        }
      };
      
      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognitionRef.current = recognition;
    }

    // Check TTS support
    if ('speechSynthesis' in window) {
      setTtsSupported(true);
      synthRef.current = window.speechSynthesis;
      
      const loadVoices = () => {
        const availableVoices = synthRef.current?.getVoices() || [];
        const spanishVoices = availableVoices.filter(v => v.lang.startsWith('es'));
        const otherVoices = availableVoices.filter(v => !v.lang.startsWith('es'));
        setVoices([...spanishVoices, ...otherVoices]);
      };
      
      loadVoices();
      speechSynthesis.onvoiceschanged = loadVoices;
    }

    return () => {
      recognitionRef.current?.abort();
      synthRef.current?.cancel();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || !settings.voice.sttEnabled) return;
    
    triggerHaptic(30);
    setTranscript('');
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      console.error('Failed to start recognition:', e);
      setIsListening(false);
    }
  }, [settings.voice.sttEnabled, triggerHaptic]);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    
    triggerHaptic(30);
    recognitionRef.current.stop();
    setIsListening(false);
  }, [triggerHaptic]);

  const resetTranscript = useCallback(() => {
    setTranscript('');
  }, []);

  const speak = useCallback((text: string) => {
    if (!synthRef.current || !settings.voice.ttsEnabled || !text) return;
    
    synthRef.current.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Ajustes para voz estilo Ukyo (Fernanda Robles - doblaje mexicano)
    // Pitch ligeramente más alto para vibe juvenil/anime
    // Rate ligeramente más rápida para energía confiada/tsundere
    utterance.rate = settings.voice.voiceRate;
    utterance.pitch = settings.voice.voicePitch;
    utterance.lang = 'es-MX';
    utterance.volume = 1.0;
    
    // Buscar la mejor voz mexicana femenina disponible
    // Prioridad: es-MX femenina > es-MX cualquiera > es-* femenina > cualquier español
    const mexicanFemaleVoice = voices.find(v => 
      v.lang === 'es-MX' && 
      (v.name.toLowerCase().includes('female') || 
       v.name.toLowerCase().includes('mujer') || 
       v.name.toLowerCase().includes('wavenet') ||
       v.name.includes('Mónica') ||
       v.name.includes('Paulina'))
    );
    
    const mexicanVoice = voices.find(v => v.lang === 'es-MX');
    const spanishFemaleVoice = voices.find(v => 
      v.lang.startsWith('es') && 
      (v.name.toLowerCase().includes('female') || v.name.toLowerCase().includes('mujer'))
    );
    const anySpanishVoice = voices.find(v => v.lang.startsWith('es'));
    
    const selectedVoice = mexicanFemaleVoice || mexicanVoice || spanishFemaleVoice || anySpanishVoice || voices[0];
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  }, [settings.voice, voices]);

  const stopSpeaking = useCallback(() => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    setIsSpeaking(false);
  }, []);

  return {
    isListening,
    transcript,
    startListening,
    stopListening,
    resetTranscript,
    sttSupported,
    isSpeaking,
    speak,
    stopSpeaking,
    ttsSupported,
    voices,
  };
}
