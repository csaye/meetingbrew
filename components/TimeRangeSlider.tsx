import { Slider } from '@mui/material';
import { Dispatch } from 'react';
import styles from '../styles/components/TimeRangeSlider.module.scss';

type Props = {
  timeRange: number[];
  setTimeRange: Dispatch<number[]>;
};

const marks = Array(25).fill(null).map((v, i) => ({
  value: i,
  label: i % 3 === 0 ? `${i % 12 || 12} ${i < 12 ? 'AM' : 'PM'}` : undefined
}));

const maxValue = 24;
const minDistance = 1;

export default function TimeRangeSlider(props: Props) {
  const { timeRange, setTimeRange } = props;

  const [earliest, latest] = timeRange;

  return (
    <div className={styles.container}>
    </div>
  );
}
