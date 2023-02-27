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
    </div>
  );
}
