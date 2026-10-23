import { useState, useEffect, useRef, useCallback } from 'react';

// Declarar SpeechRecognition para navegadores com prefixo webkit
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

interface UseVoiceTrackOptions {
  enabled: boolean;
  scriptLines: string[];
  activeLineIndex: number;
  onLineMatch: (lineIndex: number) => void;
  onSpeakingChange?: (isSpeaking: boolean) => void;
}

export function useVoiceTrack({
  enabled,
  scriptLines,
  activeLineIndex,
  onLineMatch,
  onSpeakingChange,
}: UseVoiceTrackOptions) {
  const [isListening, setIsListening] = useState(false);
  const [lastHeardText, setLastHeardText] = useState('');
  const [isSupported, setIsSupported] = useState(true);

  const recognitionRef = useRef<any>(null);
  const activeLineRef = useRef(activeLineIndex);
  activeLineRef.current = activeLineIndex;

  const scriptLinesRef = useRef(scriptLines);
  scriptLinesRef.current = scriptLines;

  // Função para normalizar strings (remover pontuações, acentos e converter para minúsculas)
  const normalize = (str: string) => {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^\w\s]/g, '')
      .trim();
  };

  // Comparador difuso entre o que foi falado e as linhas do roteiro
  const findBestMatchingLine = useCallback((spokenText: string): number | null => {
    const normalizedSpoken = normalize(spokenText);
    if (!normalizedSpoken || normalizedSpoken.length < 3) return null;

    const lines = scriptLinesRef.current;
    const currentIdx = activeLineRef.current;
    const spokenWords = normalizedSpoken.split(/\s+/).filter(Boolean);

    // Janela de busca prioritária: da linha atual até as próximas 6 linhas
    const searchWindowStart = Math.max(0, currentIdx - 1);
    const searchWindowEnd = Math.min(lines.length, currentIdx + 7);

    let bestScore = 0;
    let bestLineIndex: number | null = null;

    for (let i = searchWindowStart; i < searchWindowEnd; i++) {
      const lineText = normalize(lines[i]);
      if (!lineText) continue;

      const lineWords = lineText.split(/\s+/).filter(Boolean);
      let matchCount = 0;

      for (const sw of spokenWords) {
        if (lineWords.some((lw) => lw.includes(sw) || sw.includes(lw))) {
          matchCount++;
        }
      }

      const score = matchCount / Math.max(spokenWords.length, 1);
      // Pelo menos 2 palavras correspondentes ou 50% de match
      if (score > bestScore && (matchCount >= 2 || (spokenWords.length === 1 && matchCount === 1))) {
        bestScore = score;
        bestLineIndex = i;
      }
    }

    // Se não encontrou na janela imediata, faz busca estendida pelo restante do roteiro
    if (bestScore < 0.35 && spokenWords.length >= 2) {
      for (let i = 0; i < lines.length; i++) {
        if (i >= searchWindowStart && i < searchWindowEnd) continue;
        const lineText = normalize(lines[i]);
        if (!lineText) continue;

        const lineWords = lineText.split(/\s+/).filter(Boolean);
        let matchCount = 0;
        for (const sw of spokenWords) {
          if (lineWords.some((lw) => lw.includes(sw) || sw.includes(lw))) {
            matchCount++;
          }
        }
        const score = matchCount / Math.max(spokenWords.length, 1);
        if (score > 0.6 && score > bestScore) {
          bestScore = score;
          bestLineIndex = i;
        }
      }
    }

    return bestScore >= 0.35 ? bestLineIndex : null;
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    if (!enabled) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      onSpeakingChange?.(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI();
    recognitionRef.current = recognition;

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'pt-BR';
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event: any) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      const spokenChunk = finalTranscript || interimTranscript;
      if (spokenChunk) {
        setLastHeardText(spokenChunk);
        onSpeakingChange?.(true);

        const matchedLine = findBestMatchingLine(spokenChunk);
        if (matchedLine !== null && matchedLine !== activeLineRef.current) {
          onLineMatch(matchedLine);
        }
      }
    };

    recognition.onerror = (event: any) => {
      // Ignorar erros normais de no-speech em silêncio
      if (event.error !== 'no-speech') {
        console.warn('SpeechRecognition aviso:', event.error);
      }
    };

    recognition.onend = () => {
      onSpeakingChange?.(false);
      // Reiniciar continuamente enquanto o modo estiver ativo
      if (enabled && recognitionRef.current) {
        try {
          recognition.start();
        } catch {}
      } else {
        setIsListening(false);
      }
    };

    try {
      recognition.start();
    } catch (e) {
      console.warn('Erro ao iniciar reconhecimento de voz:', e);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }
      setIsListening(false);
      onSpeakingChange?.(false);
    };
  }, [enabled, findBestMatchingLine, onLineMatch, onSpeakingChange]);

  return {
    isListening,
    lastHeardText,
    isSupported,
  };
}
