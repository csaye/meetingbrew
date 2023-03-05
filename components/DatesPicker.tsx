import { styleBuilder } from '@/util/styles';
import moment from 'moment-timezone';
import Image from 'next/image';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import styles from '../styles/components/DatesPicker.module.scss';

type Props = {
  dates: string[];
  setDates: Dispatch<string[]>;
};

type Day = {
  year: number;
  month: number;
  day: number;
};

export default function DatesPicker(props: Props) {
  const { dates, setDates } = props;

  const [dragAdd, setDragAdd] = useState(true);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);
  const [touching, setTouching] = useState(false);

  const [mmt, setMmt] = useState(moment().startOf('month'));

  const prevMonth = mmt.clone().subtract(1, 'month');
  const nextMonth = mmt.clone().add(1, 'month');

  const daysBefore = mmt.day();
  const daysInMonth = mmt.daysInMonth();
  const daysInPrevMonth = prevMonth.daysInMonth();
  const daysLeftover = (daysBefore + daysInMonth) % 7;
  const daysAfter = daysLeftover ? 7 - daysLeftover : 0;

  // days to be displayed on calendar
  const days: Day[] = Array(daysBefore).fill(null).map((v, i) => ({
    year: prevMonth.year(),
    month: prevMonth.month(),
    day: daysInPrevMonth - (daysBefore - i - 1)
  })).concat(Array(daysInMonth).fill(null).map((v, i) => ({
    year: mmt.year(),
    month: mmt.month(),
    day: i + 1
  }))).concat(Array(daysAfter).fill(null).map((v, i) => ({
    year: nextMonth.year(),
    month: nextMonth.month(),
    day: i + 1
  })));

  // returns YYYY-MM-DD formatted date string for given day
  function dateString(day: Day) {
    const monthString = (day.month + 1).toString().padStart(2, '0');
    const dayString = day.day.toString().padStart(2, '0');
    return `${day.year}-${monthString}-${dayString}`;
  }

  // called on drag end
  const finishDrag = useCallback(() => {
    if (dragStart === null || dragEnd === null) return;
    // calculate drag range
    const minX = Math.min(dragStart % 7, dragEnd % 7);
    const maxX = Math.max(dragStart % 7, dragEnd % 7);
    const minY = Math.min(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
    const maxY = Math.max(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
    // update dates
    const newDates = dates.slice();
    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const day = days[y * 7 + x];
        const date = dateString(day);
        const dateIndex = newDates.indexOf(date);
        if (dragAdd && dateIndex === -1) newDates.push(date);
        if (!dragAdd && dateIndex !== -1) newDates.splice(dateIndex, 1);
      }
    }
    setDates(newDates);
    // clear drag positions
    setDragStart(null);
    setDragEnd(null);
  }, [dates, days, dragAdd, dragEnd, dragStart, setDates]);

  // listen for mouse up to finish drag
  useEffect(() => {
    if (touching) return;
    window.addEventListener('mouseup', finishDrag);
    return () => window.removeEventListener('mouseup', finishDrag);
  }, [finishDrag, touching]);

  // returns whether given date is currently selected
  function dateSelected(dayIndex: number) {
    const dayX = dayIndex % 7;
    const dayY = Math.floor(dayIndex / 7);
    // if dragging to remove
    if (!dragAdd && dragStart !== null && dragEnd !== null) {
      const minX = Math.min(dragStart % 7, dragEnd % 7);
      const maxX = Math.max(dragStart % 7, dragEnd % 7);
      const minY = Math.min(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
      const maxY = Math.max(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
      if (dayX >= minX && dayX <= maxX && dayY >= minY && dayY <= maxY) return false;
    }
    // if already selected
    const day = days[dayIndex];
    const date = dateString(day);
    if (dates.includes(date)) return true;
    // if dragging to add
    if (dragStart === null || dragEnd === null) return false;
    const minX = Math.min(dragStart % 7, dragEnd % 7);
    const maxX = Math.max(dragStart % 7, dragEnd % 7);
    const minY = Math.min(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
    const maxY = Math.max(Math.floor(dragStart / 7), Math.floor(dragEnd / 7));
    return dayX >= minX && dayX <= maxX && dayY >= minY && dayY <= maxY;
  }

  return (
    <div className={styles.container}>
      <div className={styles.calendar}>
        <div className={styles.month}>
          <button type="button" onClick={() => setMmt(mmt.clone().subtract(1, 'month'))}>
            <Image src="/icons/leftarrow.svg" width="24" height="24" alt="leftarrow.svg" />
          </button>
          <h4>{mmt.format('MMMM YYYY')}</h4>
          <button type="button" onClick={() => setMmt(mmt.clone().add(1, 'month'))}>
            <Image src="/icons/rightarrow.svg" width="24" height="24" alt="rightarrow.svg" />
          </button>
        </div>
        <div className={styles.headings}>
          {
            ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) =>
              <div className={styles.heading} key={i}>{d}</div>
            )
          }
        </div>
        <div className={styles.dates}>
          {
            days.map((day, i) =>
              <div
                data-index={i}
                className={styleBuilder([
                  styles.date,
                  [styles.selected, dateSelected(i)],
                  [styles.today, moment().format('YYYY-MM-DD') === dateString(day)],
                  [styles.inactive, day.month !== mmt.month()]
                ])}
                onMouseDown={() => {
                  if (touching) return;
                  setDragAdd(!dates.includes(dateString(day)));
                  setDragStart(i);
                  setDragEnd(i);
                }}
                onMouseOver={() => {
                  if (dragStart === null) return;
                  setDragEnd(i);
                }}
                onTouchStart={() => {
                  setTouching(true);
                  setDragAdd(!dates.includes(dateString(day)));
                  setDragStart(i);
                  setDragEnd(i);
                }}
                onTouchMove={e => {
                  // handle mobile drag
                  const { clientX, clientY } = e.touches[0];
                  const dayDiv = document.elementFromPoint(clientX, clientY);
                  if (!dayDiv) return;
                  const index = dayDiv.getAttribute('data-index');
                  if (index === null) return;
                  setDragEnd(parseInt(index));
                }}
                onTouchEnd={() => finishDrag()}
                key={i}
              >
                {day.day}
              </div>
            )
          }
        </div>
      </div>
      <p>Click and drag to select date ranges.</p>
    </div>
  );
}
