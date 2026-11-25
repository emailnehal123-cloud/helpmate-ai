import { useState } from 'react';
import {
  AlarmClock,
  CalendarPlus,
  Droplets,
  Plus,
  Trash2,
  X,
} from 'lucide-react';
import { UiStrings, formatEveryHours } from '../i18n/strings';
import { AlarmReminder } from '../types';
import { playAlarmSoundPreview } from '../utils/alarmAudio';
import {
  AVAILABLE_SOUNDS,
  WEEK_DAYS,
  downloadAlarmIcs,
  formatTime12Hour,
} from '../utils/alarmHelpers';

interface AlarmsScreenProps {
  alarms: AlarmReminder[];
  defaultSound: string;
  strings: UiStrings;
  onCreateAlarm: (data: {
    title: string;
    hour: number;
    minute: number;
    repeatDaysCsv: string;
    soundName: string;
    isReminder: boolean;
    intervalHours: number;
  }) => void;
  onToggleAlarm: (id: string, enabled: boolean) => void;
  onDeleteAlarm: (id: string) => void;
  onNotify: (msg: string) => void;
}

export function AlarmsScreen({
  alarms,
  defaultSound,
  strings,
  onCreateAlarm,
  onToggleAlarm,
  onDeleteAlarm,
  onNotify,
}: AlarmsScreenProps) {
  const [showCreate, setShowCreate] = useState(false);
  const [isReminder, setIsReminder] = useState(false);
  const [title, setTitle] = useState('');
  const [timeValue, setTimeValue] = useState('07:00');
  const [intervalHours, setIntervalHours] = useState(2);
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSound, setSelectedSound] = useState(defaultSound);

  const openModal = () => {
    setSelectedSound(defaultSound);
    setTitle('');
    setIsReminder(false);
    setTimeValue('07:00');
    setIntervalHours(2);
    setSelectedDays([]);
    setShowCreate(true);
  };

  const handleCreate = () => {
    const [hStr, mStr] = timeValue.split(':');
    const hour = Math.max(0, Math.min(23, Number(hStr ?? 7)));
    const minute = Math.max(0, Math.min(59, Number(mStr ?? 0)));
    const repeatDaysCsv = selectedDays.length === 0 ? 'Once' : selectedDays.join(',');

    if (
      isReminder &&
      typeof Notification !== 'undefined' &&
      Notification.permission === 'default'
    ) {
      Notification.requestPermission().catch(() => {});
    }

    onCreateAlarm({
      title: title.trim() || (isReminder ? 'Drink Water' : 'HelpMate Alarm'),
      hour,
      minute,
      repeatDaysCsv,
      soundName: selectedSound,
      isReminder,
      intervalHours,
    });
    setShowCreate(false);
    onNotify(isReminder ? 'Reminder created!' : 'Alarm saved!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <header className="hero-header" style={{ padding: '18px 20px' }}>
        <div>
          <h1 style={{ margin: '0 0 4px', fontSize: 24 }}>{strings.alarmsScreenTitle}</h1>
          <div style={{ fontSize: 13.5, opacity: 0.88 }}>{strings.alarmsScreenSubtitle}</div>
        </div>
      </header>

      <div className="page-scroll">
        {alarms.length === 0 ? (
          <div className="empty-state" style={{ marginTop: 48 }}>
            <div
              style={{
                width: 82,
                height: 82,
                borderRadius: '50%',
                background: 'var(--lavender-soft)',
                color: 'var(--purple-vibrant)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <AlarmClock size={40} />
            </div>
            <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{strings.noAlarmsTitle}</h2>
            <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: 14 }}>
              {strings.noAlarmsSubtitle}
            </p>
          </div>
        ) : (
          <div className="page-container" style={{ paddingBottom: 80 }}>
            {alarms.map((item) => (
              <div
                key={item.id}
                className="card"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: '50%',
                    background: 'var(--pill-gradient)',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.isReminder ? <Droplets size={22} /> : <AlarmClock size={22} />}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    className="font-display"
                    style={{
                      fontSize: 24,
                      fontWeight: 700,
                      color: 'var(--purple-vibrant)',
                    }}
                  >
                    {item.isReminder
                      ? formatEveryHours(strings.everyHoursTemplate, item.intervalHours)
                      : formatTime12Hour(item.hour, item.minute)}
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{item.title}</div>
                  <div style={{ fontSize: 12.5, color: 'var(--text-secondary)' }}>
                    {item.repeatDaysCsv} • {item.soundName}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                  <button
                    type="button"
                    aria-label="Toggle alarm"
                    className={`switch-toggle ${item.isEnabled ? 'on' : ''}`}
                    onClick={() => onToggleAlarm(item.id, !item.isEnabled)}
                  >
                    <span className="switch-knob" />
                  </button>

                  <div style={{ display: 'flex', gap: 4 }}>
                    {!item.isReminder && (
                      <button
                        type="button"
                        title={strings.openClockButton}
                        onClick={() => {
                          downloadAlarmIcs(item);
                          onNotify('Downloaded .ics calendar alarm!');
                        }}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          border: 'none',
                          background: 'var(--lavender-soft)',
                          color: 'var(--purple-vibrant)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <CalendarPlus size={16} />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Delete"
                      onClick={() => onDeleteAlarm(item.id)}
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.12)',
                        color: '#EF4444',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        className="fab"
        onClick={openModal}
        aria-label={strings.addAlarmButton}
        title={strings.addAlarmButton}
      >
        <Plus size={26} />
      </button>

      {showCreate && (
        <div className="modal-backdrop" onClick={() => setShowCreate(false)}>
          <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 14,
              }}
            >
              <h2 style={{ margin: 0, fontSize: 22 }}>{strings.addAlarmButton}</h2>
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                style={{
                  border: 'none',
                  background: 'var(--lavender-soft)',
                  color: 'var(--text-primary)',
                  width: 34,
                  height: 34,
                  borderRadius: '50%',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
              <button
                type="button"
                onClick={() => setIsReminder(false)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: !isReminder ? 'var(--purple-vibrant)' : 'var(--lavender-soft)',
                  color: !isReminder ? '#fff' : 'var(--purple-vibrant)',
                }}
              >
                ⏰ Alarm
              </button>
              <button
                type="button"
                onClick={() => setIsReminder(true)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: 999,
                  border: 'none',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: isReminder ? 'var(--purple-vibrant)' : 'var(--lavender-soft)',
                  color: isReminder ? '#fff' : 'var(--purple-vibrant)',
                }}
              >
                💧 Reminder
              </button>
            </div>

            <input
              type="text"
              className="text-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isReminder ? 'Reminder (e.g. Drink Water)' : 'Alarm Label'}
              style={{ marginBottom: 14 }}
            />

            {isReminder ? (
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <div
                  style={{
                    fontWeight: 700,
                    color: 'var(--purple-vibrant)',
                    marginBottom: 8,
                  }}
                >
                  {formatEveryHours(strings.everyHoursTemplate, intervalHours)}
                </div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
                  {[1, 2, 3, 4, 6].map((hrs) => (
                    <button
                      key={hrs}
                      type="button"
                      onClick={() => setIntervalHours(hrs)}
                      className={`sound-chip ${intervalHours === hrs ? 'active' : ''}`}
                    >
                      {hrs}h
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16 }}>
                <input
                  type="time"
                  className="text-input"
                  value={timeValue}
                  onChange={(e) => setTimeValue(e.target.value)}
                  style={{ fontSize: 22, fontWeight: 700, textAlign: 'center' }}
                />
              </div>
            )}

            <div className="chip-scroll" style={{ marginBottom: 10 }}>
              {WEEK_DAYS.map((day) => {
                const active = selectedDays.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    className={`day-chip ${active ? 'active' : ''}`}
                    onClick={() =>
                      setSelectedDays((prev) =>
                        prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                      )
                    }
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="chip-scroll" style={{ marginBottom: 20 }}>
              {AVAILABLE_SOUNDS.map((sound) => (
                <button
                  key={sound}
                  type="button"
                  className={`sound-chip ${selectedSound === sound ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedSound(sound);
                    playAlarmSoundPreview(sound);
                  }}
                >
                  {sound}
                </button>
              ))}
            </div>

            <button type="button" className="cta-pill" onClick={handleCreate}>
              {strings.saveAlarmButton}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
