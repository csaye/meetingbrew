import { styleBuilder } from '@/util/styles';
import moment from 'moment-timezone';
import Image from 'next/image';
import { Dispatch, useState } from 'react';
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

  // returns YYYY-MM-DD formatted date for given day
  function dayString(day: Day) {
    const monthString = (day.month + 1).toString().padStart(2, '0');
    const dayString = day.day.toString().padStart(2, '0');
    return `${day.year}-${monthString}-${dayString}`;
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
                className={styleBuilder([
                  styles.date,
                  [styles.selected, dates.includes(dayString(day))],
                  [styles.today, moment().format('YYYY-MM-DD') === dayString(day)],
                  [styles.inactive, day.month !== mmt.month()]
                ])}
                onMouseDown={() => {
                  const date = dayString(day);
                  const newDates = dates.slice();
                  const dateIndex = newDates.indexOf(date);
                  if (dateIndex === -1) newDates.push(date);
                  else newDates.splice(dateIndex, 1);
                  setDates(newDates);
                }}
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
