import { allTimezones } from 'react-timezone-select';
import spacetime, { Spacetime } from 'spacetime';

const defaultTimezone = 'Etc/GMT';

// all timezone data
const timezones = Object.entries(allTimezones).map(zone => {
  const now = spacetime.now(zone[0]);
  const tz = now.timezone();
  return { name: tz.name, label: zone[1], offset: tz.current.offset };
});
