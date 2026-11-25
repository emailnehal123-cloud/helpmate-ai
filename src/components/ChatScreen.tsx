import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  ExternalLink,
  Globe,
  Languages,
  MapPin,
  Mic,
  Send,
  Sparkles,
  Square,
  Trash2,
  X,
} from 'lucide-react';
import { UiStrings } from '../i18n/strings';
import { AlarmReminder, AppLanguage, ChatMessage } from '../types';
import { openGoogleMaps } from '../utils/alarmHelpers';
import { AlarmCardWidget } from './AlarmCardWidget';

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  start: () => void;
  stop: () => void;
}

interface ChatScreenProps {
  messages: ChatMessage[];
  alarms: AlarmReminder[];
  isThinking: boolean;
  activeTool: string | null;
  errorMessage: string | null;
  activeLanguage: AppLanguage;
  strings: UiStrings;
  onSendMessage: (text: string) => void;
  onSaveAlarm: (alarm: AlarmReminder, repeatDaysCsv: string, soundName: string) => void;
  onClearChat: () => void;
  onDismissError: () => void;
  onQuickSwitchLanguage: () => void;
  onNotify: (msg: string) => void;
}

const SUGGESTIONS = [
  '⏰ Kal subah 6 baje alarm laga do',
  '💧 Remind me to drink water every 2 hours',
  '🌐 Urdu me baat karo',
  '📍 Best biryani near me on Maps',
  '🔍 Latest AI & tech news today',
];

export function ChatScreen({
  messages,
  alarms,
  isThinking,
  activeTool,
  errorMessage,
  activeLanguage,
  strings,
  onSendMessage,
  onSaveAlarm,
  onClearChat,
  onDismissError,
  onQuickSwitchLanguage,
  onNotify,
}: ChatScreenProps) {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isThinking]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const handleSend = () => {
    const trimmed = inputText.trim();
    if (!trimmed || isThinking) return;
    setInputText('');
    onSendMessage(trimmed);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRecognitionCtor = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      onNotify('Voice input is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = activeLanguage.speechLocaleTag;
    recognition.interimResults = true;
    recognition.continuous = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => {
      setIsListening(false);
      onNotify("Couldn't hear speech, please try again.");
    };
    recognition.onresult = (event) => {
      const last = event.results[event.results.length - 1];
      const transcript = last?.[0]?.transcript;
      if (transcript) {
        setInputText(transcript);
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Top Cute Purple-Indigo Gradient Header */}
      <header className="hero-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img
            src="/helpmate-mascot.jpg"
            alt="HelpMate AI Companion"
            className="header-avatar"
          />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="font-display" style={{ fontSize: 19, fontWeight: 700 }}>
                {strings.appName}
              </span>
              <Sparkles size={16} color="#FBBF24" />
            </div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>{strings.agentOnlineBadge}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            type="button"
            className="glass-pill"
            onClick={onQuickSwitchLanguage}
            title={strings.languageSettingTitle}
          >
            <Languages size={15} color="#FBBF24" />
            <span>
              {activeLanguage.flagEmoji} {activeLanguage.code.toUpperCase()}
            </span>
          </button>

          {messages.length > 0 && (
            <button
              type="button"
              className="icon-btn-white"
              onClick={onClearChat}
              title={strings.clearChatLabel}
              aria-label={strings.clearChatLabel}
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      </header>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            margin: '10px 16px 0',
            padding: '10px 14px',
            borderRadius: 16,
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13.5,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{errorMessage}</span>
          <button
            type="button"
            onClick={onDismissError}
            aria-label="Dismiss error"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#EF4444',
              cursor: 'pointer',
              display: 'inline-flex',
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Chat Body */}
      <div className="chat-scroll">
        {messages.length === 0 ? (
          <div className="empty-state">
            <img
              src="/helpmate-mascot.jpg"
              alt="HelpMate AI Mascot"
              style={{
                width: 116,
                height: 116,
                borderRadius: '50%',
                objectFit: 'cover',
                boxShadow: 'var(--shadow-card)',
                marginBottom: 16,
              }}
            />
            <h2 style={{ margin: '0 0 6px', fontSize: 23 }}>{strings.welcomeHeading}</h2>
            <p
              style={{
                margin: '0 0 20px',
                fontSize: 14.5,
                color: 'var(--text-secondary)',
                lineHeight: 1.5,
              }}
            >
              {strings.welcomeSubtext}
            </p>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                alignItems: 'center',
              }}
            >
              {SUGGESTIONS.map((chip) => {
                const cleanPrompt = chip.substring(chip.indexOf(' ') + 1);
                return (
                  <button
                    key={chip}
                    type="button"
                    className="suggestion-chip"
                    onClick={() => onSendMessage(cleanPrompt)}
                  >
                    {chip}
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="chat-center-wrap">
            {messages.map((msg) => {
              if (msg.isUser) {
                return (
                  <div key={msg.id} className="bubble-row user">
                    <div className="bubble-user">{msg.text}</div>
                  </div>
                );
              }

              const linkedAlarm = msg.linkedAlarmId
                ? alarms.find((a) => a.id === msg.linkedAlarmId) ?? null
                : null;

              return (
                <div key={msg.id} className="bubble-row">
                  <img
                    src="/helpmate-mascot.jpg"
                    alt=""
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                    }}
                  />

                  <div className="bubble-agent-wrap">
                    <div className="bubble-agent">
                      {msg.toolBadges.length > 0 && (
                        <div className="badge-row">
                          {msg.toolBadges.map((badge) => (
                            <span key={badge} className="tool-badge">
                              ✨ {badge}
                            </span>
                          ))}
                        </div>
                      )}

                      <div>{msg.text}</div>

                      {msg.groundingSources.length > 0 && (
                        <div style={{ marginTop: 12 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              fontSize: 11.5,
                              fontWeight: 700,
                              color: 'var(--purple-vibrant)',
                              marginBottom: 6,
                            }}
                          >
                            <Globe size={13} />
                            <span>{strings.searchSourcesTitle}</span>
                          </div>
                          <div className="chip-scroll">
                            {msg.groundingSources.map((src) => (
                              <a
                                key={src.uri}
                                href={src.uri}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="source-chip"
                              >
                                <span>{src.title.slice(0, 28)}</span>
                                <ExternalLink size={12} color="#6D28D9" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {msg.mapQuery && (
                      <div className="maps-card">
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <div
                            style={{
                              width: 40,
                              height: 40,
                              borderRadius: '50%',
                              background: 'rgba(16, 185, 129, 0.14)',
                              color: '#10B981',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <MapPin size={20} />
                          </div>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11.5, fontWeight: 700, color: '#10B981' }}>
                              Google Maps
                            </div>
                            <div
                              style={{
                                fontSize: 15,
                                fontWeight: 600,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {msg.mapQuery}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="maps-btn"
                          onClick={() => openGoogleMaps(msg.mapQuery!)}
                        >
                          {strings.openMapsButton}
                        </button>
                      </div>
                    )}

                    {linkedAlarm && (
                      <AlarmCardWidget
                        alarm={linkedAlarm}
                        strings={strings}
                        onSaveAlarm={(daysCsv, sound) =>
                          onSaveAlarm(linkedAlarm, daysCsv, sound)
                        }
                        onNotify={onNotify}
                      />
                    )}
                  </div>
                </div>
              );
            })}

            {isThinking && (
              <div className="bubble-row">
                <img
                  src="/helpmate-mascot.jpg"
                  alt=""
                  className="pulse-icon"
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                  }}
                />
                <div className="thinking-bubble">
                  <Sparkles size={18} color="#FBBF24" className="pulse-icon" />
                  <div>
                    <div style={{ fontWeight: 700, color: 'var(--purple-vibrant)', fontSize: 14 }}>
                      {strings.thinkingText}
                    </div>
                    {activeTool && (
                      <div style={{ fontSize: 11.5, color: 'var(--text-secondary)' }}>
                        Using tool: {activeTool}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Bottom Rounded Input Bar */}
      <div className="composer-bar">
        <div className="composer-inner">
          <input
            type="text"
            className="composer-input"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={strings.chatInputPlaceholder}
          />

          <button
            type="button"
            className={`circle-btn mic ${isListening ? 'listening' : ''}`}
            onClick={toggleVoiceInput}
            title="Voice input"
            aria-label="Voice input"
          >
            {isListening ? <Square size={18} /> : <Mic size={20} />}
          </button>

          <button
            type="button"
            className="circle-btn send"
            disabled={!inputText.trim() || isThinking}
            onClick={handleSend}
            title="Send"
            aria-label="Send message"
          >
            <Send size={19} />
          </button>
        </div>
      </div>
    </div>
  );
}
