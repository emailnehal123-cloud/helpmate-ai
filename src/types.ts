export type LanguageCode = 'en' | 'ur' | 'hi' | 'ar' | 'fr' | 'es' | 'tr';

export interface AppLanguage {
  code: LanguageCode;
  englishName: string;
  nativeName: string;
  flagEmoji: string;
  isRtl: boolean;
  speechLocaleTag: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface AlarmReminder {
  id: string;
  title: string;
  hour: number;
  minute: number;
  repeatDaysCsv: string;
  soundName: string;
  isReminder: boolean;
  intervalHours: number;
  isEnabled: boolean;
  isSavedToClock: boolean;
  createdAt: number;
  lastTriggeredAt?: number;
}

export interface ChatMessage {
  id: string;
  isUser: boolean;
  text: string;
  toolBadges: string[];
  groundingSources: GroundingSource[];
  mapQuery?: string | null;
  linkedAlarmId?: string | null;
  createdAt: number;
}

export interface UserPreferences {
  language: LanguageCode;
  hasCompletedOnboarding: boolean;
  userName: string;
  autoDetectLanguage: boolean;
  defaultAlarmSound: string;
  darkMode: 'system' | 'light' | 'dark';
}

export type NavTab = 'chat' | 'alarms' | 'discover' | 'profile';

export interface PendingAlarmDraft {
  title: string;
  hour: number;
  minute: number;
  repeatDaysCsv: string;
  soundName: string;
  isReminder: boolean;
  intervalHours: number;
}

export interface AgentResult {
  replyText: string;
  toolsUsed: string[];
  groundingSources: GroundingSource[];
  mapQuery: string | null;
  alarmDraft: PendingAlarmDraft | null;
  switchedLanguage: LanguageCode | null;
}
