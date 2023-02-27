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

  return (
    <div className={styles.container}>
    </div>
  );
}
