import { sampleGradient } from '@/util/sampleGradient';
import { styleBuilder } from '@/util/styles';
import { Respondent } from '@/util/types';
import moment, { Moment } from 'moment-timezone';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import styles from '../styles/components/Calendar.module.scss';

type BaseBaseProps = {
  timezone: string;
  currentTimezone: string;
  dates?: string[];
  days?: number[];
  earliest: number;
  latest: number;
};

type BaseProps =
  BaseBaseProps & { type: 'select'; selectedIndices: number[]; setSelectedIndices: Dispatch<number[]>; } |
  BaseBaseProps & { type: 'display'; respondents: Respondent[]; setHoverIndex: Dispatch<number>; };

type Props =
  BaseProps & { datesType: 'dates'; dates: string[]; } |
  BaseProps & { datesType: 'days'; days: number[]; };

type Interval = {
  index: number;
  moment: Moment;
  active: boolean;
};

type CalendarDay = {
  moment: Moment;
  intervals: Interval[];
};

export default function Calendar(props: Props) {
  const { timezone, currentTimezone, earliest, latest, type, datesType } = props;

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [times, setTimes] = useState<Moment[]>();

  const [dragAdd, setDragAdd] = useState(true);
  const [dragStart, setDragStart] = useState<number[] | null>(null);
  const [dragEnd, setDragEnd] = useState<number[] | null>(null);

  // updates dates on calendar
  const updateDates = useCallback(() => {
    if (datesType !== 'dates') return;
    const { dates } = props;
    const activeIntervals: string[] = [];
    const newDates: string[] = [];
    let minHour, maxHour;
    // get all active intervals
    for (const date of dates) {
      for (let hour = earliest; hour < latest; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          // set moment and switch timezone
          const hourPadded = hour.toString().padStart(2, '0');
          const minutePadded = minute.toString().padStart(2, '0');
          let mmt = moment.tz(`${date} ${hourPadded}:${minutePadded}:00`, timezone);
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
    }
    newDates.sort();
    return { minHour, maxHour, newDates, activeIntervals };
  }, [currentTimezone, datesType, earliest, latest, props, timezone]);

  // updates days on calendar
  const updateDays = useCallback(() => {
    if (datesType !== 'days') return {};
    const { days } = props;
    const activeIntervals: string[] = [];
    const newDates: string[] = [];
    let minHour, maxHour;
    // get all active intervals
    for (const day of days) {
      for (let hour = earliest; hour < latest; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          // set moment and switch timezone
          const dayPadded = (day + 1).toString().padStart(2, '0');
          const hourPadded = hour.toString().padStart(2, '0');
          const minutePadded = minute.toString().padStart(2, '0');
          let mmt = moment.tz(`2023-01-${dayPadded} ${hourPadded}:${minutePadded}:00`, timezone);
          mmt = mmt.clone().tz(currentTimezone);
          if (mmt.month() !== 0) mmt.add(1, 'week');
          if (mmt.date() > 7) mmt.subtract(1, 'week');
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
    }
    newDates.sort();
    return { minHour, maxHour, newDates, activeIntervals };
  }, [currentTimezone, datesType, earliest, latest, props, timezone]);

  // update dates or days on info change
  useEffect(() => {
    // get interval data
    const intervalData = datesType === 'dates' ? updateDates() : updateDays();
    if (!intervalData) return;
    const { minHour, maxHour, newDates, activeIntervals } = intervalData;
    if (minHour === undefined || maxHour === undefined) throw 'undefined hours';
    // set up days
    let index = 0;
    const newDays: CalendarDay[] = [];
    for (const date of newDates) {
      const ivs: Interval[] = [];
      for (let hour = minHour; hour <= maxHour; hour++) {
        // skip if no matching hour
        if (!activeIntervals.some(i => parseInt(i.split(' ')[1].split(':')[0]) === hour)) continue;
        for (let minute = 0; minute < 60; minute += 15) {
          // add interval
          const hourPadded = hour.toString().padStart(2, '0');
          const minutePadded = minute.toString().padStart(2, '0');
          const mmt = moment.tz(`${date} ${hourPadded}:${minutePadded}:00`, currentTimezone);
          const active = activeIntervals.includes(mmt.format('YYYY-MM-DD HH:mm'));
          ivs.push({ index: active ? index : -1, moment: mmt, active });
          if (active) index++;
        }
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
      // check for time gap start
      if (hour < maxHour &&
        !activeIntervals.some(i => parseInt(i.split(' ')[1].split(':')[0]) === hour + 1)) {
        newTimes.push(mmt.clone().add(1, 'hour'));
      }
    }
    // update calendar values
    setTimes(newTimes);
    setCalendarDays(newDays);
  }, [currentTimezone, datesType, updateDates, updateDays]);

  // returns whether given interval is currently selected
  function intervalSelected(dayIndex: number, intIndex: number, index: number) {
    if (type === 'display') return false;
    const { selectedIndices } = props;
    // if dragging to remove
    if (!dragAdd && dragStart && dragEnd) {
      const maxDayIndex = Math.max(dragStart[0], dragEnd[0]);
      const minDayIndex = Math.min(dragStart[0], dragEnd[0]);
      const maxIntIndex = Math.max(dragStart[1], dragEnd[1]);
      const minIntIndex = Math.min(dragStart[1], dragEnd[1]);
      if (dayIndex >= minDayIndex && dayIndex <= maxDayIndex &&
        intIndex >= minIntIndex && intIndex <= maxIntIndex) return false;
    }
    // if already selected
    if (selectedIndices.includes(index)) return true;
    // if dragging to add
    if (!dragStart || !dragEnd) return false;
    const maxDayIndex = Math.max(dragStart[0], dragEnd[0]);
    const minDayIndex = Math.min(dragStart[0], dragEnd[0]);
    const maxIntIndex = Math.max(dragStart[1], dragEnd[1]);
    const minIntIndex = Math.min(dragStart[1], dragEnd[1]);
    if (dayIndex < minDayIndex || dayIndex > maxDayIndex) return false;
    if (intIndex < minIntIndex || intIndex > maxIntIndex) return false;
    return true;
  }

  // called on drag end
  const finishDrag = useCallback(() => {
    if (type === 'display') return;
    const { selectedIndices, setSelectedIndices } = props;
    if (!dragStart || !dragEnd) return;
    // calculate drag range
    const maxDayIndex = Math.max(dragStart[0], dragEnd[0]);
    const minDayIndex = Math.min(dragStart[0], dragEnd[0]);
    const maxIntIndex = Math.max(dragStart[1], dragEnd[1]);
    const minIntIndex = Math.min(dragStart[1], dragEnd[1]);
    // update selected indices
    const newSelectedIndices = selectedIndices.slice();
    for (let dayIndex = minDayIndex; dayIndex <= maxDayIndex; dayIndex++) {
      for (let intIndex = minIntIndex; intIndex <= maxIntIndex; intIndex++) {
        const interval = days[dayIndex].intervals[intIndex];
        if (!interval.active) continue;
        const indexIndex = newSelectedIndices.indexOf(interval.index);
        if (dragAdd && indexIndex === -1) newSelectedIndices.push(interval.index);
        if (!dragAdd && indexIndex !== -1) newSelectedIndices.splice(indexIndex, 1);
      }
    }
    setSelectedIndices(newSelectedIndices);
    // clear drag positions
    setDragStart(null);
    setDragEnd(null);
  }, [days, dragAdd, dragEnd, dragStart, type, props]);

  // listen for mouse up to finish drag
  useEffect(() => {
    window.addEventListener('mouseup', finishDrag);
    return () => window.removeEventListener('mouseup', finishDrag);
  }, [finishDrag]);

  // returns color for interval index
  function getIntervalColor(index: number) {
    if (type === 'select') return;
    const { respondents } = props;
    const colors = sampleGradient(respondents.length);
    const shade = respondents.filter(r => r.availability.includes(index)).length;
    return colors[shade];
  }

  return (
    <div className={styles.container}>
      <div className={styles.times}>
        {
          times && times.map((time, i) =>
            <div className={styles.time} key={i}>
              {time.format('h A')}
            </div>
          )
        }
      </div>
      <div className={styles.content}>
        <div className={styles.days}>
          {
            days.map((day, i) =>
              <div
                className={styleBuilder([
                  styles.day,
                  [styles.gapped, i < days.length - 1 &&
                    (day.moment.clone().add(1, 'day').format('YYYY-MM-DD') !==
                      days[i + 1].moment.format('YYYY-MM-DD'))
                  ]
                ])}
                key={i}
              >
                <div className={styles.heading}>
                  <h1>{day.moment.format('ddd')}</h1>
                  <h2>{day.moment.format('MMM D')}</h2>
                </div>
                {
                  day.intervals.map((interval, j) =>
                    <div
                      className={styleBuilder([
                        styles.interval,
                        [styles.inactive, !interval.active],
                        [styles.selected, interval.active && intervalSelected(i, j, interval.index)],
                        [styles.hoverable, type === 'select'],
                        [styles.gapped, (j > 0 && j % 4 === 0) &&
                          (day.intervals[j].moment.clone().subtract(1, 'hour').hour() !==
                            day.intervals[j - 1].moment.hour())
                        ]
                      ])}
                      style={
                        (type === 'display' && interval.active) ?
                          { background: getIntervalColor(interval.index) } :
                          undefined
                      }
                      onMouseDown={() => {
                        if (type === 'display' || !interval.active) return;
                        const { selectedIndices } = props;
                        setDragAdd(!selectedIndices.includes(interval.index));
                        setDragStart([i, j]);
                        setDragEnd([i, j]);
                      }}
                      onMouseOver={() => {
                        if (!dragStart) return;
                        setDragEnd([i, j]);
                      }}
                      key={j}
                    />
                  )
                }
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
