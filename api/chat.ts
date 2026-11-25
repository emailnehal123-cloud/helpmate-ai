import type { IncomingMessage, ServerResponse } from 'node:http';
import { GoogleGenAI, Type, type Content, type FunctionDeclaration } from '@google/genai';

interface ChatHistoryItem {
  isUser: boolean;
  text: string;
}

interface ChatRequestBody {
  userMessage: string;
  history?: ChatHistoryItem[];
  activeLanguage?: {
    code: string;
    englishName: string;
    nativeName: string;
  };
  autoDetect?: boolean;
  defaultSound?: string;
}

const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

const setAlarmDeclaration: FunctionDeclaration = {
  name: 'set_alarm',
  description:
    "Create a local alarm card and prepare a device alarm when the user asks to set an alarm for a specific time (e.g., 'Kal subah 6 baje alarm laga do', 'Set alarm for 7 AM').",
  parameters: {
    type: Type.OBJECT,
    properties: {
      hour: {
        type: Type.INTEGER,
        description: 'Hour in 24-hour format (0 to 23)',
      },
      minute: {
        type: Type.INTEGER,
        description: 'Minute (0 to 59)',
      },
      label: {
        type: Type.STRING,
        description: 'Short friendly label for the alarm',
      },
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
      title: {
        type: Type.STRING,
        description: "Short reminder title such as 'Drink Water'",
      },
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
      query: {
        type: Type.STRING,
        description: 'Concise search query',
      },
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

function readJsonBody(req: IncomingMessage & { body?: unknown }): Promise<ChatRequestBody> {
  if (req.body && typeof req.body === 'object') {
    return Promise.resolve(req.body as ChatRequestBody);
  }
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8');
        resolve(raw ? (JSON.parse(raw) as ChatRequestBody) : { userMessage: '' });
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

async function executeGroundedSearch(
  ai: GoogleGenAI,
  query: string
): Promise<{ text: string; sources: Array<{ title: string; uri: string }> }> {
  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: query,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    const text = (response.text ?? '').trim() || 'No live summary returned.';
    const sources: Array<{ title: string; uri: string }> = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    for (const chunk of chunks) {
      const uri = chunk.web?.uri;
      const title = chunk.web?.title || uri;
      if (uri && title) {
        sources.push({ title, uri });
      }
    }
    return { text, sources };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error';
    return { text: `Search encountered an issue: ${message}`, sources: [] };
  }
}

export default async function handler(
  req: IncomingMessage & { method?: string; body?: unknown },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    sendJson(res, 405, { error: 'Method not allowed' });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    sendJson(res, 500, {
      error: 'MISSING_SERVER_KEY',
      message:
        'GEMINI_API_KEY is not configured in Vercel Environment Variables. Add GEMINI_API_KEY in Vercel Project Settings or enter a personal Gemini API key in Profile.',
    });
    return;
  }

  try {
    const body = await readJsonBody(req);
    const userMessage = (body.userMessage ?? '').trim();
    if (!userMessage) {
      sendJson(res, 400, { error: 'userMessage is required' });
      return;
    }

    const activeLanguage = body.activeLanguage ?? {
      code: 'en',
      englishName: 'English',
      nativeName: 'English',
    };
    const autoDetect = body.autoDetect ?? true;
    const defaultSound = body.defaultSound || 'Starlight Chime';

    const systemInstruction = `
You are HelpMate AI — a cute, warm, cheerful, super helpful AI companion with sparkling stars!
Current UI language: ${activeLanguage.englishName} (${activeLanguage.nativeName}, code=${activeLanguage.code}).
Auto-detect mode: ${autoDetect}.

CORE RULES:
1. LANGUAGE MATCHING:
   - If Auto-detect mode is true, ALWAYS detect the language and script of the user's latest message and reply in the EXACT SAME language and script!
   - If the user writes in Roman Urdu/Hinglish (e.g. "Kal subah 6 baje alarm laga do", "Aaj mausam kaisa hai?"), reply naturally in warm, friendly Roman Urdu/Hinglish!
   - If the user writes in Urdu script, Hindi script, Arabic, French, Spanish, Turkish, or English, reply in that exact language.
   - If the user explicitly asks to switch the app's language (e.g. "Urdu me baat karo", "Hindi mein bolo", "Speak in Turkish"), you MUST call \`switch_app_language\` with the right code (\`en\`, \`ur\`, \`hi\`, \`ar\`, \`fr\`, \`es\`, \`tr\`), AND reply in that requested language!
2. AGENTIC TOOLS:
   - For alarms ("Set alarm for 7 AM", "Kal subah 6 baje alarm laga do"), ALWAYS call \`set_alarm\`.
   - For recurring interval reminders ("Remind me to drink water every 2 hours"), ALWAYS call \`set_recurring_reminder\`.
   - For live facts, weather, news, scores, or web info, ALWAYS call \`search_google\`.
   - For places, restaurants, directions, or anything involving locations/maps, ALWAYS call \`search_google_maps\`.
3. STYLE:
   - Be concise, joyful, caring, and practical. Use a touch of star/purple companion warmth without clutter.
    `.trim();

    const ai = new GoogleGenAI({ apiKey });
    const chatHistory: Content[] = (body.history ?? []).slice(-12).map((msg) => ({
      role: msg.isUser ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }));

    const contents: Content[] = [
      ...chatHistory,
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    let response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: {
        systemInstruction,
        tools: [
          {
            functionDeclarations: [
              setAlarmDeclaration,
              setReminderDeclaration,
              searchGoogleDeclaration,
              searchMapsDeclaration,
              switchLanguageDeclaration,
            ],
          },
        ],
      },
    });

    const toolsUsed: string[] = [];
    const groundingSources: Array<{ title: string; uri: string }> = [];
    let mapQuery: string | null = null;
    let alarmDraft: {
      title: string;
      hour: number;
      minute: number;
      repeatDaysCsv: string;
      soundName: string;
      isReminder: boolean;
      intervalHours: number;
    } | null = null;
    let switchedLanguage: string | null = null;

    let iterations = 0;
    while (response.functionCalls && response.functionCalls.length > 0 && iterations < 4) {
      iterations++;
      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) {
        contents.push(modelContent);
      }

      const functionResponseParts = [];

      for (const call of response.functionCalls) {
        const args = (call.args ?? {}) as Record<string, unknown>;

        if (call.name === 'set_alarm') {
          toolsUsed.push('Alarm');
          const hour = Math.max(0, Math.min(23, Number(args.hour ?? 7)));
          const minute = Math.max(0, Math.min(59, Number(args.minute ?? 0)));
          const label = String(args.label || 'HelpMate Alarm');
          const repeatDays = String(args.repeat_days || 'Once');
          const sound = String(args.sound || defaultSound);

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
              response: {
                status: 'alarm_card_ready',
                hour,
                minute,
                label,
                repeat_days: repeatDays,
                sound,
              },
            },
          });
        } else if (call.name === 'set_recurring_reminder') {
          toolsUsed.push('Reminder');
          const title = String(args.title || 'Drink Water');
          const intervalHours = Math.max(1, Math.min(24, Number(args.interval_hours ?? 2)));

          alarmDraft = {
            title,
            hour: 9,
            minute: 0,
            repeatDaysCsv: 'Daily',
            soundName: defaultSound,
            isReminder: true,
            intervalHours,
          };

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: {
                status: 'reminder_card_ready',
                title,
                interval_hours: intervalHours,
              },
            },
          });
        } else if (call.name === 'search_google') {
          toolsUsed.push('Google Search');
          const query = String(args.query || userMessage);
          const searchResult = await executeGroundedSearch(ai, query);
          groundingSources.push(...searchResult.sources);

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: {
                query,
                summary: searchResult.text,
                sources_count: searchResult.sources.length,
              },
            },
          });
        } else if (call.name === 'search_google_maps') {
          toolsUsed.push('Google Maps');
          const placeQuery = String(args.place_query || userMessage);
          mapQuery = placeQuery;
          const searchResult = await executeGroundedSearch(
            ai,
            `Find top places, address highlights, and helpful tips for: ${placeQuery}`
          );
          groundingSources.push(...searchResult.sources);

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: {
                place_query: placeQuery,
                maps_card_attached: true,
                place_info: searchResult.text,
              },
            },
          });
        } else if (call.name === 'switch_app_language') {
          toolsUsed.push('Language');
          const code = String(args.language_code || 'en').toLowerCase();
          switchedLanguage = code;

          functionResponseParts.push({
            functionResponse: {
              name: call.name,
              response: {
                status: 'language_switched',
                code,
              },
            },
          });
        }
      }

      contents.push({
        role: 'user',
        parts: functionResponseParts,
      });

      response = await ai.models.generateContent({
        model: DEFAULT_MODEL,
        contents,
        config: {
          systemInstruction,
          tools: [
            {
              functionDeclarations: [
                setAlarmDeclaration,
                setReminderDeclaration,
                searchGoogleDeclaration,
                searchMapsDeclaration,
                switchLanguageDeclaration,
              ],
            },
          ],
        },
      });
    }

    const dedupedSources = Array.from(
      new Map(groundingSources.map((s) => [s.uri, s])).values()
    ).slice(0, 4);

    sendJson(res, 200, {
      replyText: (response.text ?? '').trim() || '✨ Done!',
      toolsUsed: Array.from(new Set(toolsUsed)),
      groundingSources: dedupedSources,
      mapQuery,
      alarmDraft,
      switchedLanguage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to connect to HelpMate AI.';
    sendJson(res, 500, { error: 'AGENT_ERROR', message });
  }
}
