/**
 * Utilitários para contagem de palavras e cálculo de tempo estimado de fala no Teleprompter.
 */

export interface ScriptStats {
  words: number;
  characters: number;
}

export const calculateScriptStats = (text: string): ScriptStats => {
  const trimmed = text.trim();
  if (!trimmed) return { words: 0, characters: 0 };
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const characters = trimmed.length;
  return { words, characters };
};

/**
 * Calcula o tempo estimado de fala com base no número de palavras e na velocidade ajustada (1-100).
 * Calibração: WPM varia proporcionalmente à velocidade ajustada no slider.
 * Velocidade 28 (padrão) = ~130 WPM (ritmo natural de locução).
 */
export const calculateSpeechTime = (wordsCount: number, speed: number = 28): string => {
  if (wordsCount <= 0) return '~0s';

  const wpm = Math.max(60, Math.round(80 + (speed * 1.8)));
  const totalSeconds = Math.round((wordsCount / wpm) * 60);

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) {
    return `~${seconds}s`;
  }
  if (seconds === 0) {
    return `~${minutes}m`;
  }
  return `~${minutes}m ${seconds}s`;
};

