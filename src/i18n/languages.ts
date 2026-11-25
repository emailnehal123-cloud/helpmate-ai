import { AppLanguage, LanguageCode } from '../types';

export const APP_LANGUAGES: AppLanguage[] = [
  {
    code: 'en',
    englishName: 'English',
    nativeName: 'English',
    flagEmoji: '🇬🇧',
    isRtl: false,
    speechLocaleTag: 'en-US',
  },
  {
    code: 'ur',
    englishName: 'Urdu',
    nativeName: 'اردو',
    flagEmoji: '🇵🇰',
    isRtl: true,
    speechLocaleTag: 'ur-PK',
  },
  {
    code: 'hi',
    englishName: 'Hindi',
    nativeName: 'हिन्दी',
    flagEmoji: '🇮🇳',
    isRtl: false,
    speechLocaleTag: 'hi-IN',
  },
  {
    code: 'ar',
    englishName: 'Arabic',
    nativeName: 'العربية',
    flagEmoji: '🇸🇦',
    isRtl: true,
    speechLocaleTag: 'ar-SA',
  },
  {
    code: 'fr',
    englishName: 'French',
    nativeName: 'Français',
    flagEmoji: '🇫🇷',
    isRtl: false,
    speechLocaleTag: 'fr-FR',
  },
  {
    code: 'es',
    englishName: 'Spanish',
    nativeName: 'Español',
    flagEmoji: '🇪🇸',
    isRtl: false,
    speechLocaleTag: 'es-ES',
  },
  {
    code: 'tr',
    englishName: 'Turkish',
    nativeName: 'Türkçe',
    flagEmoji: '🇹🇷',
    isRtl: false,
    speechLocaleTag: 'tr-TR',
  },
];

export function getLanguageByCode(code?: string | null): AppLanguage {
  const normalized = code?.trim().toLowerCase();
  return (
    APP_LANGUAGES.find(
      (lang) =>
        lang.code === normalized ||
        lang.englishName.toLowerCase() === normalized
    ) ?? APP_LANGUAGES[0]
  );
}

export function detectRequestedLanguageSwitch(text: string): LanguageCode | null {
  const lower = text.toLowerCase();
  const switchKeywords = [
    'baat karo',
    'bolo',
    'speak in',
    'switch to',
    'change language',
    'talk in',
    'reply in',
    'use ',
    'parle',
    'habla',
    'konuş',
    'بات کرو',
    'बोलो',
    'تحدث',
    'بالعربية',
    'اردو میں',
  ];

  const hasSwitchIntent = switchKeywords.some((kw) => lower.includes(kw));
  if (!hasSwitchIntent) return null;

  if (lower.includes('urdu') || lower.includes('اردو')) return 'ur';
  if (lower.includes('hindi') || lower.includes('हिन्दी') || lower.includes('हिंदी')) return 'hi';
  if (
    lower.includes('arabic') ||
    lower.includes('arabi') ||
    lower.includes('عربي') ||
    lower.includes('العربية')
  ) {
    return 'ar';
  }
  if (lower.includes('french') || lower.includes('français') || lower.includes('francais')) {
    return 'fr';
  }
  if (lower.includes('spanish') || lower.includes('español') || lower.includes('espanol')) {
    return 'es';
  }
  if (lower.includes('turkish') || lower.includes('türkçe') || lower.includes('turkce')) {
    return 'tr';
  }
  if (lower.includes('english') || lower.includes('angrezi')) return 'en';

  return null;
}
