import { AlarmReminder, ChatMessage, UserPreferences } from '../types';

const PREFS_KEY = 'helpmate_prefs_v1';
const ALARMS_KEY = 'helpmate_alarms_v1';
const CHAT_KEY = 'helpmate_chat_v1';

export const DEFAULT_PREFS: UserPreferences = {
  language: 'en',
  hasCompletedOnboarding: false,
  userName: 'Friend',
  autoDetectLanguage: true,
  defaultAlarmSound: 'Starlight Chime',
  darkMode: 'system',
};

export function loadPreferences(): UserPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT_PREFS;
    return { ...DEFAULT_PREFS, ...(JSON.parse(raw) as Partial<UserPreferences>) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  } catch {
    // ignore storage quota errors
  }
}

export function loadAlarms(): AlarmReminder[] {
  try {
    const raw = localStorage.getItem(ALARMS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as AlarmReminder[];
  } catch {
    return [];
  }
}

export function saveAlarms(alarms: AlarmReminder[]): void {
  try {
    localStorage.setItem(ALARMS_KEY, JSON.stringify(alarms));
  } catch {
    // ignore
  }
}

export function loadChatMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(CHAT_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatMessage[];
  } catch {
    return [];
  }
}

export function saveChatMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch {
    // ignore
  }
}
