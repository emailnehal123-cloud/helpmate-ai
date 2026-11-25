import { useState } from 'react';
import {
  Check,
  KeyRound,
  Languages,
  Moon,
  Music,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
} from 'lucide-react';
import { APP_LANGUAGES, getLanguageByCode } from '../i18n/languages';
import { UiStrings } from '../i18n/strings';
import { getSavedCustomApiKey, setSavedCustomApiKey } from '../services/helpMateAgent';
import { LanguageCode, UserPreferences } from '../types';
import { playAlarmSoundPreview } from '../utils/alarmAudio';
import { AVAILABLE_SOUNDS } from '../utils/alarmHelpers';

interface ProfileScreenProps {
  preferences: UserPreferences;
  strings: UiStrings;
  onSelectLanguage: (code: LanguageCode) => void;
  onSaveUserName: (name: string) => void;
  onToggleAutoDetect: (enabled: boolean) => void;
  onSelectDefaultSound: (sound: string) => void;
  onChangeDarkMode: (mode: 'system' | 'light' | 'dark') => void;
  onClearChat: () => void;
  onNotify: (msg: string) => void;
}

export function ProfileScreen({
  preferences,
  strings,
  onSelectLanguage,
  onSaveUserName,
  onToggleAutoDetect,
  onSelectDefaultSound,
  onChangeDarkMode,
  onClearChat,
  onNotify,
}: ProfileScreenProps) {
  const [nameInput, setNameInput] = useState(preferences.userName);
  const [apiKeyInput, setApiKeyInput] = useState(() => getSavedCustomApiKey());
  const currentLang = getLanguageByCode(preferences.language);

  return (
    <div className="page-scroll" style={{ padding: 0 }}>
      <header className="hero-header" style={{ padding: 22, justifyContent: 'flex-start', gap: 16 }}>
        <img
          src="/helpmate-mascot.jpg"
          alt="HelpMate Companion"
          style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
        />
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 25 }}>{strings.profileTitle}</h1>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.2)',
              fontSize: 12.5,
              fontWeight: 600,
            }}
          >
            <Sparkles size={14} color="#FBBF24" />
            {currentLang.flagEmoji} {currentLang.nativeName}
          </span>
        </div>
      </header>

      <div className="page-container" style={{ padding: 16 }}>
        {/* User Name Card */}
        <div className="card">
          <div style={{ fontWeight: 700, marginBottom: 10 }}>{strings.yourNameLabel}</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              className="text-input"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
            />
            <button
              type="button"
              className="cta-pill"
              style={{ width: 52, minHeight: 46, padding: 0, flexShrink: 0 }}
              aria-label="Save name"
              onClick={() => {
                onSaveUserName(nameInput);
                onNotify('Saved!');
              }}
            >
              <Check size={20} />
            </button>
          </div>
        </div>

        {/* Language Preference Card */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Languages size={20} color="#6D28D9" />
            <span style={{ fontWeight: 700 }}>{strings.languageSettingTitle}</span>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
            {APP_LANGUAGES.map((lang) => {
              const selected = lang.code === preferences.language;
              return (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => onSelectLanguage(lang.code)}
                  className={`sound-chip ${selected ? 'active' : ''}`}
                  style={{
                    borderRadius: 16,
                    padding: '9px 12px',
                    background: selected ? 'var(--purple-vibrant)' : 'var(--lavender-soft)',
                    color: selected ? '#fff' : 'var(--purple-vibrant)',
                  }}
                >
                  {lang.flagEmoji} {lang.nativeName}
                </button>
              );
            })}
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{strings.autoDetectTitle}</div>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                {strings.autoDetectSubtitle}
              </div>
            </div>
            <button
              type="button"
              aria-label={strings.autoDetectTitle}
              className={`switch-toggle ${preferences.autoDetectLanguage ? 'on' : ''}`}
              onClick={() => onToggleAutoDetect(!preferences.autoDetectLanguage)}
            >
              <span className="switch-knob" />
            </button>
          </div>
        </div>

        {/* Default Alarm Sound */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <Music size={20} color="#6D28D9" />
            <span style={{ fontWeight: 700 }}>{strings.defaultSoundTitle}</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {AVAILABLE_SOUNDS.map((sound) => {
              const selected = preferences.defaultAlarmSound === sound;
              return (
                <button
                  key={sound}
                  type="button"
                  className={`sound-chip ${selected ? 'active' : ''}`}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px' }}
                  onClick={() => {
                    onSelectDefaultSound(sound);
                    playAlarmSoundPreview(sound);
                  }}
                >
                  <Volume2 size={14} />
                  {sound}
                </button>
              );
            })}
          </div>
        </div>

        {/* Appearance */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            {preferences.darkMode === 'dark' ? (
              <Moon size={20} color="#6D28D9" />
            ) : (
              <Sun size={20} color="#6D28D9" />
            )}
            <span style={{ fontWeight: 700 }}>Theme</span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['system', 'light', 'dark'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                className={`sound-chip ${preferences.darkMode === mode ? 'active' : ''}`}
                style={{ padding: '8px 16px', textTransform: 'capitalize' }}
                onClick={() => onChangeDarkMode(mode)}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Optional Local Gemini API Key (Fallback if testing outside Vercel) */}
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <KeyRound size={18} color="#6D28D9" />
            <span style={{ fontWeight: 700 }}>Gemini API Key (Optional Local Fallback)</span>
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 12.5, color: 'var(--text-secondary)' }}>
            On Vercel, set <code>GEMINI_API_KEY</code> in Project Environment Variables to keep your
            key server-side. For local Vite testing, you can optionally save a key in browser
            storage below.
          </p>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="password"
              className="text-input"
              placeholder="AIza..."
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
            />
            <button
              type="button"
              className="cta-pill"
              style={{ width: 78, minHeight: 44, fontSize: 13.5, flexShrink: 0 }}
              onClick={() => {
                setSavedCustomApiKey(apiKeyInput);
                onNotify(apiKeyInput.trim() ? 'API key saved locally!' : 'Local API key cleared');
              }}
            >
              Save
            </button>
          </div>
        </div>

        {/* Clear Chat */}
        <button
          type="button"
          onClick={() => {
            onClearChat();
            onNotify('Chat cleared');
          }}
          style={{
            width: '100%',
            height: 50,
            borderRadius: 999,
            border: '1px solid rgba(239, 68, 68, 0.5)',
            background: 'transparent',
            color: '#EF4444',
            fontWeight: 700,
            fontSize: 14.5,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
          }}
        >
          <Trash2 size={18} />
          {strings.clearChatLabel}
        </button>
      </div>
    </div>
  );
}
