import moment, { Moment } from 'moment-timezone';
import { useCallback, useEffect, useState } from 'react';
import styles from '../styles/components/Calendar.module.scss';

type Props = {
  timezone: string;
  currentTimezone: string;
  dates: string[];
  earliest: number;
  latest: number;
};

type Interval = {
  index: number;
  moment: Moment;
  active: boolean;
};

type Day = {
  moment: Moment;
  intervals: Interval[];
};

export default function Calendar(props: Props) {
  const { timezone, currentTimezone, dates, earliest, latest } = props;

  const [days, setDays] = useState<Day[]>([]);
  const [times, setTimes] = useState<Moment[]>();

  const [dragAdd, setDragAdd] = useState(true);
  const [dragStart, setDragStart] = useState<number[] | null>(null);
  const [dragEnd, setDragEnd] = useState<number[] | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);

  // update days on info change
  useEffect(() => {
    const activeIntervals: string[] = [];
    const newDates: string[] = [];
    let index = 0;
    let minHour, maxHour;
    for (const date of dates) {
      for (let hour = earliest; hour < latest; hour++) {
        // set moment and switch timezone
        const hourPadded = hour.toString().padStart(2, '0');
        let mmt = moment.tz(`${date} ${hourPadded}:00:00`, timezone);
        mmt = mmt.clone().tz(currentTimezone);
        // update hour range
        const hr = mmt.hour();
        if (minHour === undefined || hr < minHour) minHour = hr;
        if (maxHour === undefined || hr > maxHour) maxHour = hr;
        // record date and create interval
        const newDate = mmt.format('YYYY-MM-DD');
        if (!newDates.includes(newDate)) newDates.push(newDate);
        activeIntervals.push(mmt.format('YYYY-MM-DD HH:mm'));
      }
    }
    if (minHour === undefined || maxHour === undefined) throw 'undefined hours';
    // set up days
    const newDays: Day[] = [];
    for (const date of newDates) {
      const ivs: Interval[] = [];
      for (let hour = minHour; hour <= maxHour; hour++) {
        // skip if no matching hour
        if (!activeIntervals.some(i => parseInt(i.split(' ')[1].split(':')[0]) === hour)) continue;
        // add interval
        const hourPadded = hour.toString().padStart(2, '0');
        const mmt = moment.tz(`${date} ${hourPadded}:00:00`, currentTimezone);
        const active = activeIntervals.includes(mmt.format('YYYY-MM-DD HH:mm'));
        ivs.push({ index: active ? index : -1, moment: mmt, active });
        if (active) index++;
      }
      const mmt = moment.tz(date, currentTimezone);
      newDays.push({ moment: mmt, intervals: ivs });
    }
    // get times
    const newTimes: Moment[] = [];
    for (let hour = minHour; hour <= maxHour + 1; hour++) {
      // skip if no matching hour
      if (
        hour !== maxHour + 1 &&
        !activeIntervals.some(i => parseInt(i.split(' ')[1].split(':')[0]) === hour)
      ) continue;
      const hourPadded = hour.toString().padStart(2, '0');
      const mmt = moment.tz(`${newDates[0]} ${hourPadded}:00:00`, currentTimezone);
      newTimes.push(mmt);
    }
    // update calendar values
    setTimes(newTimes);
    setDays(newDays);
  }, [days, dragAdd, dragEnd, dragStart, selectedIndices]);

  return (
    <div className={styles.container}>
    </div>
  );
}
