import {
  AlarmPlus,
  ArrowRight,
  Droplets,
  Globe,
  Languages,
  MapPin,
  Sun,
} from 'lucide-react';
import { UiStrings } from '../i18n/strings';

interface DiscoverScreenProps {
  strings: UiStrings;
  onRunPromptInChat: (prompt: string) => void;
}

const DISCOVER_ITEMS = [
  {
    id: 'alarm_urdu',
    title: 'Morning Alarm (Roman Urdu)',
    subtitle: 'Kal subah 6 baje alarm laga do',
    badge: 'Alarm Tool',
    prompt: 'Kal subah 6 baje alarm laga do',
    icon: AlarmPlus,
    accent: '#6D28D9',
    bg: 'rgba(109, 40, 217, 0.14)',
  },
  {
    id: 'water_reminder',
    title: 'Hydration Habit',
    subtitle: 'Remind me to drink water every 2 hours',
    badge: 'Reminder',
    prompt: 'Remind me to drink water every 2 hours',
    icon: Droplets,
    accent: '#0EA5E9',
    bg: 'rgba(14, 165, 233, 0.14)',
  },
  {
    id: 'maps_biryani',
    title: 'Nearby Food on Maps',
    subtitle: 'Find top rated biryani restaurants near me',
    badge: 'Google Maps',
    prompt: 'Find top rated biryani restaurants near me on Google Maps',
    icon: MapPin,
    accent: '#10B981',
    bg: 'rgba(16, 185, 129, 0.14)',
  },
  {
    id: 'google_search',
    title: 'Live Google Search',
    subtitle: 'Latest technology & AI news today',
    badge: 'Google Search',
    prompt: "Search Google for today's top technology and AI news",
    icon: Globe,
    accent: '#4F46E5',
    bg: 'rgba(79, 70, 229, 0.14)',
  },
  {
    id: 'urdu_switch',
    title: 'Switch to Urdu Mode',
    subtitle: 'Urdu me baat karo — instant UI switch',
    badge: 'Language',
    prompt: 'Urdu me baat karo',
    icon: Languages,
    accent: '#D97706',
    bg: 'rgba(217, 119, 6, 0.14)',
  },
  {
    id: 'weather_check',
    title: 'Weather & Outfit Tip',
    subtitle: 'Aaj Karachi ka mausam kaisa hai?',
    badge: 'Google Search',
    prompt: 'Aaj Karachi ka mausam kaisa hai?',
    icon: Sun,
    accent: '#EC4899',
    bg: 'rgba(236, 72, 153, 0.14)',
  },
];

export function DiscoverScreen({ strings, onRunPromptInChat }: DiscoverScreenProps) {
  return (
    <div className="page-scroll">
      <div className="page-container">
        <div
          style={{
            borderRadius: 26,
            background: 'var(--hero-gradient)',
            color: '#fff',
            padding: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <span
              style={{
                display: 'inline-block',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.2)',
                color: '#FBBF24',
                fontSize: 12,
                fontWeight: 700,
                marginBottom: 10,
              }}
            >
              ✨ HelpMate Agent Tools
            </span>
            <h1 style={{ margin: '0 0 4px', fontSize: 26 }}>{strings.discoverTitle}</h1>
            <p style={{ margin: 0, fontSize: 14, opacity: 0.88 }}>{strings.discoverSubtitle}</p>
          </div>
          <img
            src="/helpmate-mascot.jpg"
            alt="HelpMate Mascot"
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
          />
        </div>

        {DISCOVER_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onRunPromptInChat(item.prompt)}
              className="card"
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                textAlign: 'start',
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 16,
                  background: item.bg,
                  color: item.accent,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={24} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <span className="tool-badge" style={{ marginBottom: 4 }}>
                  {item.badge}
                </span>
                <div style={{ fontSize: 15.5, fontWeight: 700, color: 'var(--text-primary)' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text-secondary)' }}>
                  {item.subtitle}
                </div>
              </div>

              <ArrowRight size={20} color="#6D28D9" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
