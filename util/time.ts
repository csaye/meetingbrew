import { Interval } from '@/util/types';

// returns time string for given hour and minute
export function timeString(hour: number, minute?: number) {
  const amPm = hour < 12 || hour === 24 ? 'AM' : 'PM';
  const hourString = (hour % 12 || 12).toString();
  if (minute === undefined) return `${hourString} ${amPm}`;
  const minuteString = minute.toString().padStart(2, '0');
  return `${hourString}:${minuteString} ${amPm}`;
}

// returns time by interval index
export function intervalTimeString(interval: Interval) {
  const { hour, minute } = interval;
  const startTime = timeString(hour, minute);
  const nextMinute = (minute + 15) % 60;
  const nextHour = nextMinute ? hour : (hour + 1) % 24;
  const endTime = timeString(nextHour, nextMinute);
  return `${startTime} – ${endTime}`;
}
