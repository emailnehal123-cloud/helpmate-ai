import { useEffect, useState } from 'react';
import { AlarmClock, BellRing, Compass, MessageCircle, User } from 'lucide-react';
import { AlarmsScreen } from './components/AlarmsScreen';
import { ChatScreen } from './components/ChatScreen';
import { DiscoverScreen } from './components/DiscoverScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { ProfileScreen } from './components/ProfileScreen';
import { detectRequestedLanguageSwitch, getLanguageByCode } from './i18n/languages';
import { LOCALIZED_STRINGS } from './i18n/strings';
import { runHelpMateAgentTurn } from './services/helpMateAgent';
import {
  loadAlarms,
  loadChatMessages,
  loadPreferences,
  saveAlarms,
  saveChatMessages,
  savePreferences,
} from './storage/localStore';
import { AlarmReminder, ChatMessage, LanguageCode, NavTab, UserPreferences } from './types';
import { playAlarmSoundPreview } from './utils/alarmAudio';

function makeId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function App() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => loadPreferences());
  const [alarms, setAlarms] = useState<AlarmReminder[]>(() => loadAlarms());
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadChatMessages());
  const [activeTab, setActiveTab] = useState<NavTab>('chat');
  const [isThinking, setIsThinking] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [ringingAlarm, setRingingAlarm] = useState<AlarmReminder | null>(null);

  const activeLanguage = getLanguageByCode(prefs.language);
  const strings = LOCALIZED_STRINGS[prefs.language];

  const notify = (msg: string) => {
    setToast(msg);
  };

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(t);
  }, [toast]);

  // Sync RTL direction and theme
  useEffect(() => {
    document.documentElement.dir = activeLanguage.isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = activeLanguage.code;
  }, [activeLanguage]);

  useEffect(() => {
    const applyTheme = () => {
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const isDark =
        prefs.darkMode === 'dark' || (prefs.darkMode === 'system' && systemDark);
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    };
    applyTheme();
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', applyTheme);
    return () => mq.removeEventListener('change', applyTheme);
  }, [prefs.darkMode]);

  useEffect(() => {
    savePreferences(prefs);
  }, [prefs]);

  useEffect(() => {
    saveAlarms(alarms);
  }, [alarms]);

  useEffect(() => {
    saveChatMessages(messages);
  }, [messages]);

  // Live in-browser alarm & recurring reminder scheduler
  useEffect(() => {
    const checkAlarms = () => {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayShort = dayNames[now.getDay()];
      const nowMs = now.getTime();

      setAlarms((prev) => {
        let changed = false;
        const next = prev.map((alarm) => {
          if (!alarm.isEnabled) return alarm;

          if (alarm.isReminder) {
            const intervalMs = Math.max(1, alarm.intervalHours) * 60 * 60 * 1000;
            const baseline = alarm.lastTriggeredAt ?? alarm.createdAt;
            if (nowMs - baseline >= intervalMs) {
              changed = true;
              triggerAlert(alarm);
              return { ...alarm, lastTriggeredAt: nowMs };
            }
          } else {
            const matchesDay =
              alarm.repeatDaysCsv === 'Once' ||
              alarm.repeatDaysCsv.toLowerCase() === 'daily' ||
              alarm.repeatDaysCsv.includes(todayShort);

            const alreadyTriggeredRecently =
              alarm.lastTriggeredAt && nowMs - alarm.lastTriggeredAt < 65_000;

            if (
              matchesDay &&
              !alreadyTriggeredRecently &&
              alarm.hour === currentHour &&
              alarm.minute === currentMinute
            ) {
              changed = true;
              triggerAlert(alarm);
              return {
                ...alarm,
                lastTriggeredAt: nowMs,
                isEnabled: alarm.repeatDaysCsv === 'Once' ? false : alarm.isEnabled,
              };
            }
          }
          return alarm;
        });
        return changed ? next : prev;
      });
    };

    const triggerAlert = (alarm: AlarmReminder) => {
      setRingingAlarm(alarm);
      playAlarmSoundPreview(alarm.soundName);
      if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
        new Notification(`⏰ ${alarm.title}`, {
          body: alarm.isReminder
            ? `HelpMate Reminder (${alarm.soundName})`
            : `HelpMate Alarm (${alarm.soundName})`,
          icon: '/helpmate-mascot.jpg',
        });
      }
    };

    const timer = window.setInterval(checkAlarms, 15_000);
    return () => window.clearInterval(timer);
  }, []);

  const updatePrefs = (patch: Partial<UserPreferences>) => {
    setPrefs((prev) => ({ ...prev, ...patch }));
  };

  const handleSendMessage = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isThinking) return;

    const instantSwitch = detectRequestedLanguageSwitch(trimmed);
    const effectiveLangCode = instantSwitch ?? prefs.language;
    if (instantSwitch && instantSwitch !== prefs.language) {
      updatePrefs({ language: instantSwitch });
    }

    const userMsg: ChatMessage = {
      id: makeId(),
      isUser: true,
      text: trimmed,
      toolBadges: [],
      groundingSources: [],
      createdAt: Date.now(),
    };

    const historyBeforeSend = messages;
    setMessages((prev) => [...prev, userMsg]);
    setIsThinking(true);
    setActiveTool(null);
    setErrorMessage(null);

    try {
      const result = await runHelpMateAgentTurn({
        userMessage: trimmed,
        history: historyBeforeSend,
        activeLanguage: getLanguageByCode(effectiveLangCode),
        autoDetect: prefs.autoDetectLanguage,
        defaultSound: prefs.defaultAlarmSound,
        onToolThinking: (tool) => setActiveTool(tool),
      });

      if (result.switchedLanguage) {
        updatePrefs({ language: result.switchedLanguage });
      }

      let linkedAlarmId: string | null = null;
      if (result.alarmDraft) {
        const newAlarm: AlarmReminder = {
          id: makeId(),
          title: result.alarmDraft.title,
          hour: result.alarmDraft.hour,
          minute: result.alarmDraft.minute,
          repeatDaysCsv: result.alarmDraft.repeatDaysCsv,
          soundName: result.alarmDraft.soundName,
          isReminder: result.alarmDraft.isReminder,
          intervalHours: result.alarmDraft.intervalHours,
          isEnabled: true,
          isSavedToClock: false,
          createdAt: Date.now(),
        };
        linkedAlarmId = newAlarm.id;
        setAlarms((prev) => [newAlarm, ...prev]);
      }

      const aiMsg: ChatMessage = {
        id: makeId(),
        isUser: false,
        text: result.replyText,
        toolBadges: result.toolsUsed,
        groundingSources: result.groundingSources,
        mapQuery: result.mapQuery,
        linkedAlarmId,
        createdAt: Date.now(),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Failed to connect to HelpMate AI.'
      );
    } finally {
      setIsThinking(false);
      setActiveTool(null);
    }
  };

  if (!prefs.hasCompletedOnboarding) {
    return (
      <OnboardingScreen
        selectedLanguage={prefs.language}
        onSelectLanguage={(code: LanguageCode) => updatePrefs({ language: code })}
        onCompleteOnboarding={(code: LanguageCode) =>
          updatePrefs({ language: code, hasCompletedOnboarding: true })
        }
      />
    );
  }

  const tabs: Array<{ id: NavTab; label: string; icon: typeof MessageCircle }> = [
    { id: 'chat', label: strings.navChat, icon: MessageCircle },
    { id: 'alarms', label: strings.navAlarms, icon: AlarmClock },
    { id: 'discover', label: strings.navDiscover, icon: Compass },
    { id: 'profile', label: strings.navProfile, icon: User },
  ];

  return (
    <div className="app-shell">
      {/* Desktop / Tablet Side Navigation Rail */}
      <nav className="nav-rail" aria-label="Primary navigation">
        <img
          src="/helpmate-mascot.jpg"
          alt="HelpMate AI"
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            objectFit: 'cover',
            marginBottom: 10,
          }}
        />
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon-pill">
                <Icon size={20} />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Active Screen */}
      <main className="main-content">
        {ringingAlarm && (
          <div className="alarm-ring-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BellRing size={20} />
              <span>
                ⏰ {ringingAlarm.title} ({ringingAlarm.soundName})
              </span>
            </div>
            <button
              type="button"
              onClick={() => setRingingAlarm(null)}
              style={{
                border: 'none',
                borderRadius: 999,
                padding: '6px 14px',
                background: '#fff',
                color: '#6D28D9',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Dismiss
            </button>
          </div>
        )}

        {activeTab === 'chat' && (
          <ChatScreen
            messages={messages}
            alarms={alarms}
            isThinking={isThinking}
            activeTool={activeTool}
            errorMessage={errorMessage}
            activeLanguage={activeLanguage}
            strings={strings}
            onSendMessage={handleSendMessage}
            onSaveAlarm={(alarm, repeatDaysCsv, soundName) => {
              setAlarms((prev) =>
                prev.map((a) =>
                  a.id === alarm.id
                    ? { ...a, repeatDaysCsv, soundName, isEnabled: true, isSavedToClock: true }
                    : a
                )
              );
            }}
            onClearChat={() => setMessages([])}
            onDismissError={() => setErrorMessage(null)}
            onQuickSwitchLanguage={() => setActiveTab('profile')}
            onNotify={notify}
          />
        )}

        {activeTab === 'alarms' && (
          <AlarmsScreen
            alarms={alarms}
            defaultSound={prefs.defaultAlarmSound}
            strings={strings}
            onCreateAlarm={(data) => {
              const newItem: AlarmReminder = {
                id: makeId(),
                title: data.title,
                hour: data.hour,
                minute: data.minute,
                repeatDaysCsv: data.repeatDaysCsv,
                soundName: data.soundName,
                isReminder: data.isReminder,
                intervalHours: data.isReminder ? data.intervalHours : 0,
                isEnabled: true,
                isSavedToClock: !data.isReminder,
                createdAt: Date.now(),
              };
              setAlarms((prev) => [newItem, ...prev]);
            }}
            onToggleAlarm={(id, enabled) =>
              setAlarms((prev) =>
                prev.map((a) => (a.id === id ? { ...a, isEnabled: enabled } : a))
              )
            }
            onDeleteAlarm={(id) => setAlarms((prev) => prev.filter((a) => a.id !== id))}
            onNotify={notify}
          />
        )}

        {activeTab === 'discover' && (
          <DiscoverScreen
            strings={strings}
            onRunPromptInChat={(prompt) => {
              setActiveTab('chat');
              handleSendMessage(prompt);
            }}
          />
        )}

        {activeTab === 'profile' && (
          <ProfileScreen
            preferences={prefs}
            strings={strings}
            onSelectLanguage={(code) => updatePrefs({ language: code })}
            onSaveUserName={(name) =>
              updatePrefs({ userName: name.trim() || 'Friend' })
            }
            onToggleAutoDetect={(enabled) =>
              updatePrefs({ autoDetectLanguage: enabled })
            }
            onSelectDefaultSound={(sound) => updatePrefs({ defaultAlarmSound: sound })}
            onChangeDarkMode={(darkMode) => updatePrefs({ darkMode })}
            onClearChat={() => setMessages([])}
            onNotify={notify}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav" aria-label="Bottom navigation">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              className={`nav-item ${active ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="nav-icon-pill">
                <Icon size={20} />
              </span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {toast && <div className="toast-banner">{toast}</div>}
    </div>
  );
}

export default App;
