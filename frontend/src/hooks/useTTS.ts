import { useCallback } from 'react';

// ISO 639-1 → BCP-47 language tag for Web Speech API
const LANG_TO_BCP47: Record<string, string> = {
  en: 'en-US',
  uk: 'uk-UA',
  fr: 'fr-FR',
  de: 'de-DE',
  es: 'es-ES',
  it: 'it-IT',
  pt: 'pt-PT',
  pl: 'pl-PL',
  nl: 'nl-NL',
  sv: 'sv-SE',
  da: 'da-DK',
  nb: 'nb-NO',
  fi: 'fi-FI',
  cs: 'cs-CZ',
  sk: 'sk-SK',
  hu: 'hu-HU',
  ro: 'ro-RO',
  bg: 'bg-BG',
  hr: 'hr-HR',
  zh: 'zh-CN',
  ja: 'ja-JP',
  ko: 'ko-KR',
  ar: 'ar-SA',
  he: 'he-IL',
  hi: 'hi-IN',
  tr: 'tr-TR',
  ru: 'ru-RU',
};

export function useTTS() {
  const speak = useCallback((text: string, langCode = 'en') => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.lang = LANG_TO_BCP47[langCode] ?? langCode;
    utt.rate = 0.85;
    utt.pitch = 1.0;
    window.speechSynthesis.speak(utt);
  }, []);

  const stop = useCallback(() => {
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  }, []);

  const isSupported = 'speechSynthesis' in window;

  return { speak, stop, isSupported };
}
