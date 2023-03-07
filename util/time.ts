// returns time string for given hour and minute
export function timeString(hour: number, minute?: number) {
  const amPm = hour < 12 || hour === 24 ? 'AM' : 'PM';
  const hourString = (hour % 12 || 12).toString();
  if (minute === undefined) return `${hourString} ${amPm}`;
  const minuteString = minute.toString().padStart(2, '0');
  return `${hourString}:${minuteString} ${amPm}`;
}
