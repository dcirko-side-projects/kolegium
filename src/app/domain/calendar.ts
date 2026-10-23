import { addDays, weekStart } from './schedule';

export type CalendarView = 'day' | 'week' | 'month';

export function calendarWindow(date: string, view: CalendarView): { from: string; until: string } {
  if (view === 'day') return { from: date, until: date };
  if (view === 'week') {
    const from = weekStart(date);
    return { from, until: addDays(from, 6) };
  }
  const first = date.slice(0, 7) + '-01';
  const next = new Date(first + 'T12:00:00Z');
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = addDays(next.toISOString().slice(0, 10), -1);
  return { from: weekStart(first), until: addDays(weekStart(last), 6) };
}

export function moveCalendar(date: string, view: CalendarView, count: number): string {
  if (view !== 'month') return addDays(date, count * (view === 'week' ? 7 : 1));
  const next = new Date(date.slice(0, 7) + '-01T12:00:00Z');
  next.setUTCMonth(next.getUTCMonth() + count);
  const first = next.toISOString().slice(0, 10);
  next.setUTCMonth(next.getUTCMonth() + 1);
  const last = Number(addDays(next.toISOString().slice(0, 10), -1).slice(8));
  return first.slice(0, 8) + String(Math.min(Number(date.slice(8)), last)).padStart(2, '0');
}
