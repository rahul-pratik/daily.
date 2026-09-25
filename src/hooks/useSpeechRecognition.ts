import { useState, useEffect, useRef, useCallback } from 'react';

interface UseSpeechRecognitionOptions {
  onResult?: (transcriptChunk: string) => void;
  continuous?: boolean;
  interimResults?: boolean;
  lang?: string;
}

export function useSpeechRecognition({
  onResult,
  continuous = true,
  interimResults = false,
  lang = 'en-US',
}: UseSpeechRecognitionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const onResultRef = useRef(onResult);
  onResultRef.current = onResult;

  const isSupported =
    typeof window !== 'undefined' &&
    Boolean(
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition
    );

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (err) {
        console.warn('Speech recognition stop notice:', err);
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    if (!isSupported) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    try {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
        recognitionRef.current = null;
      }

      const SpeechRecognitionClass =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = continuous;
      recognition.interimResults = interimResults;
      recognition.lang = lang;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
      };

      recognition.onresult = (event: any) => {
        let chunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const res = event.results[i];
          if (res && res[0]) {
            chunk += res[0].transcript;
          }
        }

        const trimmedChunk = chunk.trim();
        if (trimmedChunk) {
          setTranscript((prev) => (prev ? `${prev} ${trimmedChunk}` : trimmedChunk));
          if (onResultRef.current) {
            onResultRef.current(trimmedChunk);
          }
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event:', event.error);
        if (event.error === 'not-allowed') {
          setError('Microphone access denied. Please allow microphone permission.');
          setIsListening(false);
        } else if (event.error === 'no-speech') {
          // Momentary silence, keep active
        } else if (event.error === 'aborted') {
          setIsListening(false);
        } else {
          setError(`Speech dictation notice: ${event.error}`);
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Speech recognition start error:', err);
      setIsListening(false);
      setError(err?.message || 'Could not start microphone speech dictation.');
    }
  }, [isSupported, continuous, interimResults, lang]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {}
      }
    };
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    error,
    startListening,
    stopListening,
    toggleListening,
  };
}
