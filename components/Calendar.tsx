import { sampleGradient } from '@/util/sampleGradient';
import { styleBuilder } from '@/util/styles';
import { intervalTimeString, timeString } from '@/util/time';
import { Interval, Respondent } from '@/util/types';
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
  BaseBaseProps & {
    type: 'select';
    selectedIndices: number[];
    setSelectedIndices:
    Dispatch<number[]>;
  } |
  BaseBaseProps & {
    type: 'display';
    respondents: Respondent[] | undefined;
    selectedRespondents: string[];
    hoveredRespondent: string | null;
    hoveredShade: number | null;
    hoverInterval: Interval | null;
    setHoverInterval: Dispatch<Interval | null>;
  };

type Props =
  BaseProps & { datesType: 'dates'; dates: string[]; } |
  BaseProps & { datesType: 'days'; days: number[]; };

type CalendarDay = {
  moment: Moment;
  intervals: Interval[];
};

export default function Calendar(props: Props) {
  const { timezone, currentTimezone, earliest, latest, type, datesType } = props;

  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [hours, setHours] = useState<number[]>();

  const [dragAdd, setDragAdd] = useState(true);
  const [dragStart, setDragStart] = useState<number[] | null>(null);
  const [dragEnd, setDragEnd] = useState<number[] | null>(null);
  const [touching, setTouching] = useState(false);

  // updates dates on calendar
  const updateDates = useCallback(() => {
    if (datesType !== 'dates') return;
    const dates = props.dates;
    const activeIntervals: string[] = [];
    const newDates: string[] = [];
    const fallBackHours: number[] = [];
    const fallBackDates: string[] = [];
    let minHour, maxHour;
    // get all active intervals
    for (const date of dates) {
      // get start moment for day
      const hourPadded = earliest.toString().padStart(2, '0');
      let mmt = moment.tz(`${date} ${hourPadded}:00:00`, timezone);
      // continue in 15 minute intervals until latest hour reached
      while (mmt.hour() < latest && mmt.format('YYYY-MM-DD') === date) {
        // clone moment into current timezone
        const currentMmt = mmt.clone().tz(currentTimezone);
        // update hour range
        const hr = currentMmt.hour();
        if (minHour === undefined || hr < minHour) minHour = hr;
        if (maxHour === undefined || hr > maxHour) maxHour = hr;
        // record date and create interval
        const newDate = currentMmt.format('YYYY-MM-DD');
        if (!newDates.includes(newDate)) newDates.push(newDate);
        const dateTime = currentMmt.format('YYYY-MM-DD HH:mm');
        // save if fall back hour or date
        if (activeIntervals.includes(dateTime)) {
          if (!fallBackHours.includes(hr)) fallBackHours.push(hr);
          if (!fallBackDates.includes(newDate)) fallBackDates.push(newDate);
        }
        activeIntervals.push(dateTime);
        // increment base moment
        mmt.add(15, 'minutes');
      }
    }
    newDates.sort();
    return { minHour, maxHour, newDates, activeIntervals, fallBackHours, fallBackDates };
  }, [currentTimezone, datesType, earliest, latest, props.dates, timezone]);

  // updates days on calendar
  const updateDays = useCallback(() => {
    if (datesType !== 'days') return {};
    const days = props.days;
    const activeIntervals: string[] = [];
    const newDates: string[] = [];
    const fallBackHours: number[] = [];
    const fallBackDates: string[] = [];
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
    return { minHour, maxHour, newDates, activeIntervals, fallBackHours, fallBackDates };
  }, [currentTimezone, datesType, earliest, latest, props.days, timezone]);

  // returns hour parsed from YYYY-MM-DD HH:mm string
  function parseHour(date: string) {
    return parseInt(date.split(' ')[1].split(':')[0]);
  }

  // update dates or days on info change
  useEffect(() => {
    // get interval data
    const intervalData = datesType === 'dates' ? updateDates() : updateDays();
    if (!intervalData) return;
    const { minHour, maxHour, newDates, activeIntervals, fallBackHours, fallBackDates } = intervalData;
    if (minHour === undefined || maxHour === undefined) throw 'undefined hours';
    // set up days
    let index = 0;
    const newDays: CalendarDay[] = [];
    for (const date of newDates) {
      const ivs: Interval[] = [];
      const selfFallBack = fallBackDates.includes(date);
      for (let hour = minHour; hour <= maxHour; hour++) {
        // skip if no matching active hour
        const activeHourExists = activeIntervals.some(i => parseHour(i) === hour);
        if (!activeHourExists) continue;
        const fallBack = fallBackHours.includes(hour);
        for (let i = 0; i < (fallBack ? 2 : 1); i++) {
          for (let minute = 0; minute < 60; minute += 15) {
            // add interval
            const hourPadded = hour.toString().padStart(2, '0');
            const minutePadded = minute.toString().padStart(2, '0');
            const mmt = moment.tz(`${date} ${hourPadded}:${minutePadded}:00`, currentTimezone);
            const active = mmt.hour() !== hour ? false : // skip invalid spring forward
              (i === 1 && !selfFallBack) ? false : // skip invalid fall back
                activeIntervals.includes(mmt.format('YYYY-MM-DD HH:mm'));
            ivs.push({ index: active ? index : -1, hour, minute, active });
            if (active) index++;
          }
        }
      }
      const mmt = moment.tz(date, currentTimezone);
      newDays.push({ moment: mmt, intervals: ivs });
    }
    // get times
    const newHours: number[] = [];
    for (let hour = minHour; hour <= maxHour; hour++) {
      // skip if no matching hour
      if (!activeIntervals.some(i => parseHour(i) === hour)) continue;
      newHours.push(hour);
      // duplicate hour if fall back
      const fallBack = newDays.some(d => d.intervals.filter(i => i.hour === hour).length > 4);
      if (fallBack) newHours.push(hour);
      // check for time gap start
      if (hour < maxHour &&
        !activeIntervals.some(i => parseHour(i) === hour + 1)) {
        newHours.push(hour + 1);
      }
    }
    newHours.push(maxHour + 1);
    // update calendar values
    setHours(newHours);
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
        const interval = calendarDays[dayIndex].intervals[intIndex];
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
  }, [type, props, dragStart, dragEnd, calendarDays, dragAdd]);

  // listen for mouse up to finish drag
  useEffect(() => {
    if (touching) return;
    window.addEventListener('mouseup', finishDrag);
    return () => window.removeEventListener('mouseup', finishDrag);
  }, [finishDrag, touching]);

  // returns shade for interval index
  function getShade(index: number) {
    if (type !== 'display') throw 'getting color for select calendar';
    const { respondents } = props;
    if (!respondents) return 0;
    return respondents.filter(r => r.availability.includes(index)).length;
  }

  // returns color for interval index
  function getIntervalColor(index: number) {
    if (type !== 'display') throw 'getting color for select calendar';
    const { respondents } = props;
    if (!respondents) return '#e0e0e0';
    const colors = sampleGradient(respondents.length);
    const shade = getShade(index);
    return colors[shade];
  }

  // returns whether given interval index is faded
  function intervalFaded(interval: Interval) {
    if (type !== 'display') throw 'getting fade for select calendar';
    const { respondents, selectedRespondents, hoveredRespondent, hoveredShade } = props;
    if (!respondents) return false;
    if (!selectedRespondents.length && hoveredRespondent === null && hoveredShade === null) return false;
    const currRespondents = respondents.filter(r => selectedRespondents.includes(r.id) || r.id === hoveredRespondent);
    const { index, active } = interval;
    if (!active) return true;
    if (hoveredShade !== null && getShade(interval.index) !== hoveredShade) return true;
    for (const r of currRespondents) {
      if (!r.availability.includes(index)) return true;
    }
    return false;
  }

  // starts dragging
  function startDrag(interval: Interval, i: number, j: number) {
    if (type !== 'select' || !interval.active) return;
    const { selectedIndices } = props;
    setDragAdd(!selectedIndices.includes(interval.index));
    setDragStart([i, j]);
    setDragEnd([i, j]);
  }

  // handles hover for given interval
  function handleHover(interval: Interval) {
    if (!interval.active || type !== 'display') return;
    const { setHoverInterval } = props;
    setHoverInterval(interval);
  }

  // returns whether given interval is hovered
  function isHovered(interval: Interval) {
    if (type !== 'display' || !interval.active) return false;
    const { hoverInterval } = props;
    if (!hoverInterval) return false;
    return hoverInterval.index === interval.index;
  }

  // returns interval by index
  function getInterval(index: number) {
    for (const day of calendarDays) {
      for (const interval of day.intervals) {
        if (interval.index === index) return interval;
      }
    }
    return null;
  }

  return (
    <div className={styles.container}>
      {
        (type === 'display' && touching && props.hoverInterval) &&
        <div className={styles.namesPopup}>
          <div className={styles.head}>
            <h2>{intervalTimeString(props.hoverInterval)}</h2>
          </div>
          <div className={styles.names}>
            {
              !props.respondents ? <p className={styles.name}>Loading...</p> :
                props.respondents.map((r, i) =>
                  <p
                    className={styleBuilder([
                      styles.name,
                      [styles.unavailable, !r.availability.includes(
                        props.hoverInterval?.index ?? -1
                      )]
                    ])}
                    key={i}
                  >
                    {r.name}
                  </p>
                )
            }
          </div>
        </div>
      }
      <div className={styles.hours}>
        {
          hours && hours.map((hour, i) =>
            <div
              className={styleBuilder([
                styles.hour,
                [styles.hidden, i > 0 && hours[i - 1] === hour]
              ])}
              key={i}
            >
              {timeString(hour)}
            </div>
          )
        }
      </div>
      <div className={styles.content}>
        <div className={styles.days}>
          {
            calendarDays.map((day, i) =>
              <div
                className={styleBuilder([
                  styles.day,
                  [styles.gapped, i < calendarDays.length - 1 &&
                    (day.moment.clone().add(1, 'day').format('YYYY-MM-DD') !==
                      calendarDays[i + 1].moment.format('YYYY-MM-DD'))
                  ]
                ])}
                key={i}
              >
                <div className={styles.heading}>
                  <h1>{day.moment.format('ddd')}</h1>
                  {
                    datesType === 'dates' &&
                    <h2>{day.moment.format('MMM D')}</h2>
                  }
                </div>
                {
                  day.intervals.map((interval, j) =>
                    <div
                      data-index={interval.index}
                      data-i={i}
                      data-j={j}
                      className={styleBuilder([
                        styles.interval,
                        [styles.inactive, !interval.active],
                        [styles.selected, interval.active && intervalSelected(i, j, interval.index)],
                        [styles.select, type === 'select'],
                        [styles.display, type === 'display'],
                        [styles.hovered, type === 'select' && isHovered(interval)],
                        [styles.faded, type === 'display' && intervalFaded(interval)],
                        [styles.gapped, (j > 0 && j % 4 === 0) &&
                          (day.intervals[j].hour !==
                            day.intervals[j - 1].hour) &&
                          (day.intervals[j].hour - 1 !==
                            day.intervals[j - 1].hour)
                        ]
                      ])}
                      style={
                        (type === 'display' && interval.active) ?
                          { background: getIntervalColor(interval.index) } :
                          undefined
                      }
                      onMouseDown={() => {
                        if (touching) return;
                        startDrag(interval, i, j);
                      }}
                      onMouseOver={() => {
                        if (touching) return;
                        handleHover(interval);
                        if (dragStart) setDragEnd([i, j]);
                      }}
                      onMouseLeave={() => {
                        if (interval.active && type === 'display') {
                          const { setHoverInterval } = props;
                          setHoverInterval(null);
                        }
                      }}
                      onTouchStart={() => {
                        setTouching(true);
                        startDrag(interval, i, j);
                        handleHover(interval);
                      }}
                      onTouchMove={e => {
                        const { clientX, clientY } = e.touches[0];
                        const dayDiv = document.elementFromPoint(clientX, clientY);
                        if (!dayDiv) return;
                        // handle mobile drag
                        if (type === 'select' && dragStart) {
                          const dataI = dayDiv.getAttribute('data-i');
                          const dataJ = dayDiv.getAttribute('data-j');
                          if (dataI === null || dataJ === null) return;
                          setDragEnd([parseInt(dataI), parseInt(dataJ)]);
                        }
                        if (type === 'display') {
                          const { setHoverInterval } = props;
                          const index = dayDiv.getAttribute('data-index');
                          if (index === null) return;
                          const iv = getInterval(parseInt(index));
                          setHoverInterval(iv);
                        }
                      }}
                      onTouchEnd={() => {
                        if (type === 'display') {
                          const { setHoverInterval } = props;
                          setHoverInterval(null);
                        }
                        finishDrag();
                      }}
                      key={j}
                    />
                  )
                }
                <div className={styles.scroller} />
              </div>
            )
          }
        </div>
      </div>
    </div>
  );
}
