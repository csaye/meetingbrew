import { styleBuilder } from '@/util/styles';
import moment from 'moment-timezone';
import Image from 'next/image';
import { Dispatch, useState } from 'react';
import styles from '../styles/components/DatesPicker.module.scss';

type Props = {
  dates: string[];
  setDates: Dispatch<string[]>;
};

export default function DatesPicker(props: Props) {
  const { dates, setDates } = props;

  const [mmt, setMmt] = useState(moment().startOf('month'));

  const daysBefore = mmt.day();
  const daysInMonth = mmt.daysInMonth();
  const daysInPrevMonth = mmt.clone().subtract(1, 'month').daysInMonth();
  const daysLeftover = (daysBefore + daysInMonth) % 7;
  const daysAfter = daysLeftover ? 7 - daysLeftover : 0;

  // returns YYYY-MM-DD formatted date for given day of month
  function getDate(day: number) {
    return `${mmt.format('YYYY-MM-')}${day.toString().padStart(2, '0')}`;
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
        <div className={styles.dates} style={{ marginBottom: '12px' }}>
          {
            Array(daysBefore).fill(null).map((v, i) =>
              <div className={`${styles.date} ${styles.inactive}`} key={i}>
                {daysInPrevMonth - (daysBefore - i - 1)}
              </div>
            )
          }
          {
            Array(daysInMonth).fill(null).map((v, i) =>
              <div
                className={styleBuilder([
                  styles.date,
                  [styles.selected, dates.includes(getDate(i + 1))],
                  [styles.today, moment().format('YYYY-MM-DD') === getDate(i + 1)]
                ])}
                onMouseDown={() => {
                  const date = getDate(i + 1);
                  const newDates = dates.slice();
                  const dateIndex = newDates.indexOf(date);
                  if (dateIndex === -1) newDates.push(date);
                  else newDates.splice(dateIndex, 1);
                  setDates(newDates);
                }}
                key={i}
              >
                {i + 1}
              </div>
            )
          }
          {
            Array(daysAfter).fill(null).map((v, i) =>
              <div className={`${styles.date} ${styles.inactive}`} key={i}>
                {i + 1}
              </div>
            )
          }
        </div>
      </div>
      <p style={{ color: 'var(--secondary-text)', fontWeight: 300 }}>Click and drag to select date ranges.</p>
    </div>
  );
}
