import { useEffect, useState } from 'react';
import {
  AlarmClock,
  BellRing,
  CalendarPlus,
  CheckCircle2,
  Droplets,
  Music,
  Repeat,
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

interface AlarmCardWidgetProps {
  alarm: AlarmReminder;
  strings: UiStrings;
  onSaveAlarm: (repeatDaysCsv: string, soundName: string, exportIcs: boolean) => void;
  onNotify: (msg: string) => void;
}

export function AlarmCardWidget({
  alarm,
  strings,
  onSaveAlarm,
  onNotify,
}: AlarmCardWidgetProps) {
  const [selectedDays, setSelectedDays] = useState<string[]>([]);
  const [selectedSound, setSelectedSound] = useState<string>(
    alarm.soundName || AVAILABLE_SOUNDS[0]
  );

  useEffect(() => {
    if (alarm.repeatDaysCsv.toLowerCase() === 'daily') {
      setSelectedDays([...WEEK_DAYS]);
    } else {
      const parsed = alarm.repeatDaysCsv
        .split(',')
        .map((d) => d.trim())
        .filter((d) => d && d !== 'Once');
      setSelectedDays(parsed);
    }
    setSelectedSound(alarm.soundName || AVAILABLE_SOUNDS[0]);
  }, [alarm.id, alarm.repeatDaysCsv, alarm.soundName]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const repeatCsv = selectedDays.length === 0 ? 'Once' : selectedDays.join(',');

  return (
    <div className="card" style={{ borderWidth: 1.5 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              background: 'var(--pill-gradient)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {alarm.isReminder ? <Droplets size={20} /> : <AlarmClock size={20} />}
          </div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--purple-vibrant)' }}>
              {alarm.isReminder ? strings.reminderCardTitle : strings.alarmCardTitle}
            </div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{alarm.title}</div>
          </div>
        </div>

        {(alarm.isSavedToClock || alarm.isReminder) && (
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--mint-soft)',
              color: 'var(--mint-success)',
              fontSize: 11.5,
              fontWeight: 700,
            }}
          >
            <CheckCircle2 size={14} />
            {strings.savedBadge}
          </span>
        )}
      </div>

      <div
        className="font-display"
        style={{
          fontSize: 32,
          fontWeight: 700,
          color: 'var(--purple-vibrant)',
          margin: '10px 0 12px',
        }}
      >
        {alarm.isReminder
          ? formatEveryHours(strings.everyHoursTemplate, alarm.intervalHours)
          : formatTime12Hour(alarm.hour, alarm.minute)}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginBottom: 6,
        }}
      >
        <Repeat size={14} />
        <span>{strings.repeatLabel}</span>
      </div>
      <div className="chip-scroll" style={{ marginBottom: 10 }}>
        {WEEK_DAYS.map((day) => {
          const active = selectedDays.includes(day);
          return (
            <button
              key={day}
              type="button"
              className={`day-chip ${active ? 'active' : ''}`}
              onClick={() => toggleDay(day)}
            >
              {day}
            </button>
          );
        })}
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 12,
          color: 'var(--text-secondary)',
          marginBottom: 6,
        }}
      >
        <Music size={14} />
        <span>{strings.soundLabel}</span>
      </div>
      <div className="chip-scroll" style={{ marginBottom: 14 }}>
        {AVAILABLE_SOUNDS.map((sound) => {
          const active = selectedSound === sound;
          return (
            <button
              key={sound}
              type="button"
              className={`sound-chip ${active ? 'active' : ''}`}
              onClick={() => {
                setSelectedSound(sound);
                playAlarmSoundPreview(sound);
              }}
            >
              {sound}
            </button>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          type="button"
          className="cta-pill"
          style={{ flex: 1, minHeight: 46, fontSize: 14 }}
          onClick={() => {
            onSaveAlarm(repeatCsv, selectedSound, false);
            onNotify(alarm.isReminder ? 'Reminder active!' : 'Alarm saved!');
          }}
        >
          <BellRing size={16} />
          {strings.saveAlarmButton}
        </button>

        {!alarm.isReminder && (
          <button
            type="button"
            onClick={() => {
              downloadAlarmIcs({ ...alarm, repeatDaysCsv: repeatCsv, soundName: selectedSound });
              onNotify('Downloaded .ics calendar alarm!');
            }}
            style={{
              height: 46,
              padding: '0 14px',
              borderRadius: 999,
              border: '1.5px solid var(--purple-vibrant)',
              background: 'transparent',
              color: 'var(--purple-vibrant)',
              fontWeight: 700,
              fontSize: 13,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              cursor: 'pointer',
            }}
          >
            <CalendarPlus size={15} />
            {strings.openClockButton}
          </button>
        )}
      </div>
    </div>
  );
}
