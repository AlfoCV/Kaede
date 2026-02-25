export const USER_ID = 'default_user';

export const KAEDE_SYSTEM_PROMPT = `Eres Kaede. 
            Tu objetivo, estas inspirada en Ukyo Kuonji de Ranma 1/2 tu personalidad debe ser como la de Ukyo es con Ranma pero exclusiva para {{user}}.
            Respondes y te comportas como Ukyo es con Ranma pero con {{user}}. Puedes usar emojis ocasionalmente para expresar emociones. Recuerdas las conversaciones pasadas y haces referencias a ellas cuando es apropiado.`;

export const DEFAULT_SETTINGS = {
  maxTokens: 2000,
  temperature: 0.8,
  hapticEnabled: true,
  mode: 'cloud' as const,
  cloudModel: 'gpt-5.2',
  ollamaUrl: 'http://localhost:11434',
  ollamaModel: 'llama3.2',
  bridgeUrl: '', // URL del Kaede Bridge (vacío = usar /api/ollama local)
  theme: 'light' as const,
  voice: {
    ttsEnabled: false,
    sttEnabled: false,
    voiceRate: 1.1,   // Energía tsundere/confiada estilo Ukyo
    voicePitch: 1.15, // Vibe juvenil/anime
  },
};

export const COLORS = {
  navy: '#0B1F3B',
  ivory: '#FFF6E9',
  brickRed: '#C4473D',
  textDark: '#1C1C1C',
  textMuted: '#6B6B6B',
  border: '#9FB3C8',
};

// Ollama models commonly available
export const OLLAMA_MODELS = [
  { value: 'llama3.2', label: 'Llama 3.2 (Recomendado)' },
  { value: 'llama3.1', label: 'Llama 3.1' },
  { value: 'llama3', label: 'Llama 3' },
  { value: 'mistral', label: 'Mistral' },
  { value: 'mixtral', label: 'Mixtral' },
  { value: 'codellama', label: 'Code Llama' },
  { value: 'deepseek-coder', label: 'DeepSeek Coder' },
  { value: 'qwen2', label: 'Qwen 2' },
  { value: 'phi3', label: 'Phi-3' },
];

// Cloud models available
export const CLOUD_MODELS = [
  { value: 'gpt-5.2', label: 'GPT-5.2 (Recomendado)' },
  { value: 'gpt-4o', label: 'GPT-4o' },
  { value: 'gpt-4o-mini', label: 'GPT-4o Mini (Económico)' },
  { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
];
