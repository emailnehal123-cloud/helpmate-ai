import { AlarmReminder } from '../types';

export const AVAILABLE_SOUNDS = [
  'Starlight Chime',
  'Cosmic Bell',
  'Morning Dew',
  'Gentle Sunrise',
] as const;

export const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export function formatTime12Hour(hour: number, minute: number): string {
  const h24 = Math.max(0, Math.min(23, hour));
  const m = Math.max(0, Math.min(59, minute));
  const period = h24 >= 12 ? 'PM' : 'AM';
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
}

export function downloadAlarmIcs(alarm: AlarmReminder): void {
  const now = new Date();
  const target = new Date(now);
  target.setHours(alarm.hour, alarm.minute, 0, 0);
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  const formatIcsDate = (d: Date) =>
    d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  const end = new Date(target.getTime() + 15 * 60 * 1000);
  const icsLines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//HelpMate AI//Web Alarm//EN',
    'BEGIN:VEVENT',
    `UID:helpmate-${alarm.id}@helpmate.ai`,
    `DTSTAMP:${formatIcsDate(now)}`,
    `DTSTART:${formatIcsDate(target)}`,
    `DTEND:${formatIcsDate(end)}`,
    `SUMMARY:⏰ ${alarm.title}`,
    `DESCRIPTION:HelpMate AI Alarm (${alarm.soundName}) - Repeat: ${alarm.repeatDaysCsv}`,
    'BEGIN:VALARM',
    'TRIGGER:-PT0M',
    'ACTION:DISPLAY',
    `DESCRIPTION:${alarm.title}`,
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ];

  const blob = new Blob([icsLines.join('\r\n')], {
    type: 'text/calendar;charset=utf-8',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${alarm.title.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'helpmate-alarm'}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function openGoogleMaps(query: string): void {
  const encoded = encodeURIComponent(query);
  window.open(
    `https://www.google.com/maps/search/?api=1&query=${encoded}`,
    '_blank',
    'noopener,noreferrer'
  );
}
