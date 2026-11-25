import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from '@google/genai';
import {
  AgentResult,
  AppLanguage,
  ChatMessage,
  GroundingSource,
  LanguageCode,
  PendingAlarmDraft,
} from '../types';
import { getLanguageByCode } from '../i18n/languages';

const CUSTOM_API_KEY_STORAGE = 'helpmate_custom_gemini_key';
const CLIENT_FALLBACK_MODEL = 'gemini-2.5-flash';

export function getSavedCustomApiKey(): string {
  try {
    return localStorage.getItem(CUSTOM_API_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setSavedCustomApiKey(key: string): void {
  try {
    const trimmed = key.trim();
    if (trimmed) {
      localStorage.setItem(CUSTOM_API_KEY_STORAGE, trimmed);
    } else {
      localStorage.removeItem(CUSTOM_API_KEY_STORAGE);
    }
  } catch {
    // ignore storage errors
  }
}

const setAlarmDeclaration: FunctionDeclaration = {
  name: 'set_alarm',
  description:
    "Create a local alarm card and prepare an alarm when the user asks to set an alarm for a specific time (e.g., 'Kal subah 6 baje alarm laga do', 'Set alarm for 7 AM').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hour: { type: Type.INTEGER, description: 'Hour in 24-hour format (0 to 23)' },
      minute: { type: Type.INTEGER, description: 'Minute (0 to 59)' },
      label: { type: Type.STRING, description: 'Short friendly label for the alarm' },
      repeat_days: {
        type: Type.STRING,
        description: "Comma-separated repeat days like 'Mon,Tue,Wed' or 'Once' or 'Daily'",
      },
      sound: {
        type: Type.STRING,
        description:
          "Preferred alarm tone name such as 'Starlight Chime', 'Cosmic Bell', 'Morning Dew', or 'Gentle Sunrise'",
      },
    },
    required: ['hour', 'minute', 'label'],
  },
};

const setReminderDeclaration: FunctionDeclaration = {
  name: 'set_recurring_reminder',
  description:
    "Create a recurring local reminder (for example: 'Remind me to drink water every 2 hours').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: "Short reminder title such as 'Drink Water'" },
      interval_hours: {
        type: Type.INTEGER,
        description: 'Repeat interval in hours (e.g., 2 for every 2 hours)',
      },
    },
    required: ['title', 'interval_hours'],
  },
};

const searchGoogleDeclaration: FunctionDeclaration = {
  name: 'search_google',
  description:
    'Search Google in real time for current facts, news, weather, prices, sports scores, or live information.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Concise search query' },
    },
    required: ['query'],
  },
};

const searchMapsDeclaration: FunctionDeclaration = {
  name: 'search_google_maps',
  description:
    'Find places, restaurants, pharmacies, cafes, landmarks, or directions for Google Maps.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      place_query: {
        type: Type.STRING,
        description:
          "Place or category plus city/area if mentioned, e.g., 'best biryani near Gulberg Lahore' or 'nearest pharmacy'",
      },
    },
    required: ['place_query'],
  },
};

const switchLanguageDeclaration: FunctionDeclaration = {
  name: 'switch_app_language',
  description:
    "Switch the entire HelpMate AI app language when the user asks to speak in a specific language (e.g., 'Urdu me baat karo', 'Speak in Arabic', 'Switch to French').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      language_code: {
        type: Type.STRING,
        description: 'ISO code of the target language: en, ur, hi, ar, fr, es, or tr',
        enum: ['en', 'ur', 'hi', 'ar', 'fr', 'es', 'tr'],
      },
    },
    required: ['language_code'],
  },
};

async function runDirectClientAgent(params: {
  apiKey: string;
  userMessage: string;
  history: ChatMessage[];
  activeLanguage: AppLanguage;
  autoDetect: boolean;
  defaultSound: string;
  onToolThinking: (tool: string) => void;
}): Promise<AgentResult> {
  const ai = new GoogleGenAI({ apiKey: params.apiKey });

  const systemInstruction = `
You are HelpMate AI — a cute, warm, cheerful, super helpful AI companion with sparkling stars!
Current UI language: ${params.activeLanguage.englishName} (${params.activeLanguage.nativeName}, code=${params.activeLanguage.code}).
Auto-detect mode: ${params.autoDetect}.

CORE RULES:
1. LANGUAGE MATCHING:
   - If Auto-detect mode is true, ALWAYS detect the language and script of the user's latest message and reply in the EXACT SAME language and script!
   - If the user writes in Roman Urdu/Hinglish, reply naturally in warm, friendly Roman Urdu/Hinglish!
   - If the user explicitly asks to switch the app's language, call \`switch_app_language\` with \`en\`, \`ur\`, \`hi\`, \`ar\`, \`fr\`, \`es\`, or \`tr\`.
2. AGENTIC TOOLS:
   - For alarms, ALWAYS call \`set_alarm\`.
   - For recurring interval reminders, ALWAYS call \`set_recurring_reminder\`.
   - For live facts, weather, news, scores, or web info, ALWAYS call \`search_google\`.
   - For places, restaurants, directions, or anything involving locations/maps, ALWAYS call \`search_google_maps\`.
  `.trim();

  const contents: Content[] = [
    ...params.history.slice(-12).map((m) => ({
      role: (m.isUser ? 'user' : 'model') as 'user' | 'model',
      parts: [{ text: m.text }],
    })),
    { role: 'user', parts: [{ text: params.userMessage }] },
  ];

  const tools = [
    {
      functionDeclarations: [
        setAlarmDeclaration,
        setReminderDeclaration,
        searchGoogleDeclaration,
        searchMapsDeclaration,
        switchLanguageDeclaration,
      ],
    },
  ];

  let response = await ai.models.generateContent({
    model: CLIENT_FALLBACK_MODEL,
    contents,
    config: { systemInstruction, tools },
  });

  const toolsUsed: string[] = [];
  const groundingSources: GroundingSource[] = [];
  let mapQuery: string | null = null;
  let alarmDraft: PendingAlarmDraft | null = null;
  let switchedLanguage: LanguageCode | null = null;

  let iterations = 0;
  while (response.functionCalls && response.functionCalls.length > 0 && iterations < 4) {
    iterations++;
    const modelContent = response.candidates?.[0]?.content;
    if (modelContent) contents.push(modelContent);

    const functionResponseParts = [];

    for (const call of response.functionCalls) {
      const args = (call.args ?? {}) as Record<string, unknown>;
      if (call.name === 'set_alarm') {
        toolsUsed.push('Alarm');
        params.onToolThinking('Alarm');
        const hour = Math.max(0, Math.min(23, Number(args.hour ?? 7)));
        const minute = Math.max(0, Math.min(59, Number(args.minute ?? 0)));
        const label = String(args.label || 'HelpMate Alarm');
        const repeatDays = String(args.repeat_days || 'Once');
        const sound = String(args.sound || params.defaultSound);
        alarmDraft = {
          title: label,
          hour,
          minute,
          repeatDaysCsv: repeatDays,
          soundName: sound,
          isReminder: false,
          intervalHours: 0,
        };
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { status: 'alarm_card_ready', hour, minute, label },
          },
        });
      } else if (call.name === 'set_recurring_reminder') {
        toolsUsed.push('Reminder');
        params.onToolThinking('Reminder');
        const title = String(args.title || 'Drink Water');
        const intervalHours = Math.max(1, Math.min(24, Number(args.interval_hours ?? 2)));
        alarmDraft = {
          title,
          hour: 9,
          minute: 0,
          repeatDaysCsv: 'Daily',
          soundName: params.defaultSound,
          isReminder: true,
          intervalHours,
        };
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { status: 'reminder_card_ready', title, interval_hours: intervalHours },
          },
        });
      } else if (call.name === 'search_google' || call.name === 'search_google_maps') {
        const isMaps = call.name === 'search_google_maps';
        toolsUsed.push(isMaps ? 'Google Maps' : 'Google Search');
        params.onToolThinking(isMaps ? 'Google Maps' : 'Google Search');
        const query = isMaps
          ? String(args.place_query || params.userMessage)
          : String(args.query || params.userMessage);
        if (isMaps) mapQuery = query;

        const searchRes = await ai.models.generateContent({
          model: CLIENT_FALLBACK_MODEL,
          contents: isMaps
            ? `Find top places, address highlights, and helpful tips for: ${query}`
            : query,
          config: { tools: [{ googleSearch: {} }] },
        });
        const chunks = searchRes.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
        for (const chunk of chunks) {
          if (chunk.web?.uri) {
            groundingSources.push({
              title: chunk.web.title || chunk.web.uri,
              uri: chunk.web.uri,
            });
          }
        }
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: {
              query,
              summary: (searchRes.text ?? '').trim() || 'No live summary returned.',
            },
          },
        });
      } else if (call.name === 'switch_app_language') {
        toolsUsed.push('Language');
        params.onToolThinking('Language');
        const lang = getLanguageByCode(String(args.language_code || 'en'));
        switchedLanguage = lang.code;
        functionResponseParts.push({
          functionResponse: {
            name: call.name,
            response: { status: 'language_switched', code: lang.code },
          },
        });
      }
    }

    contents.push({ role: 'user', parts: functionResponseParts });
    response = await ai.models.generateContent({
      model: CLIENT_FALLBACK_MODEL,
      contents,
      config: { systemInstruction, tools },
    });
  }

  return {
    replyText: (response.text ?? '').trim() || '✨ Done!',
    toolsUsed: Array.from(new Set(toolsUsed)),
    groundingSources: Array.from(
      new Map(groundingSources.map((s) => [s.uri, s])).values()
    ).slice(0, 4),
    mapQuery,
    alarmDraft,
    switchedLanguage,
  };
}

export async function runHelpMateAgentTurn(params: {
  userMessage: string;
  history: ChatMessage[];
  activeLanguage: AppLanguage;
  autoDetect: boolean;
  defaultSound: string;
  onToolThinking: (tool: string) => void;
}): Promise<AgentResult> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 60_000);

  try {
    const customKey = getSavedCustomApiKey();

    // Try Vercel serverless endpoint first
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        userMessage: params.userMessage,
        history: params.history.slice(-12).map((m) => ({
          isUser: m.isUser,
          text: m.text,
        })),
        activeLanguage: {
          code: params.activeLanguage.code,
          englishName: params.activeLanguage.englishName,
          nativeName: params.activeLanguage.nativeName,
        },
        autoDetect: params.autoDetect,
        defaultSound: params.defaultSound,
      }),
    });

    if (res.ok) {
      const data = (await res.json()) as {
        replyText: string;
        toolsUsed?: string[];
        groundingSources?: GroundingSource[];
        mapQuery?: string | null;
        alarmDraft?: PendingAlarmDraft | null;
        switchedLanguage?: string | null;
      };
      return {
        replyText: data.replyText || '✨ Done!',
        toolsUsed: data.toolsUsed ?? [],
        groundingSources: data.groundingSources ?? [],
        mapQuery: data.mapQuery ?? null,
        alarmDraft: data.alarmDraft ?? null,
        switchedLanguage: data.switchedLanguage
          ? getLanguageByCode(data.switchedLanguage).code
          : null,
      };
    }

    // If running locally on plain `vite` dev server (404) or server key missing, use personal key if provided
    const errBody = await res.json().catch(() => ({}));
    if (customKey) {
      return await runDirectClientAgent({ ...params, apiKey: customKey });
    }

    throw new Error(
      errBody?.message ||
        'Server AI endpoint unavailable. On Vercel, add GEMINI_API_KEY in Environment Variables (or add a test key in Profile).'
    );
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new Error('HelpMate took a little too long to respond (60s timeout). Please try again.');
    }
    const customKey = getSavedCustomApiKey();
    if (customKey && err instanceof TypeError) {
      return await runDirectClientAgent({ ...params, apiKey: customKey });
    }
    throw err instanceof Error ? err : new Error('Failed to connect to HelpMate AI.');
  } finally {
    window.clearTimeout(timeout);
  }
}
