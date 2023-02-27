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

  // handles time range slider value change
  function handleChange(e: Event, val: number | number[], thumb: number) {
    if (!Array.isArray(val)) return;
    if (val[1] - val[0] < minDistance) {
      if (thumb === 0) {
        const clamped = Math.min(val[0], maxValue - minDistance);
        setTimeRange([clamped, clamped + minDistance]);
      } else {
        const clamped = Math.max(val[1], minDistance);
        setTimeRange([clamped - minDistance, clamped]);
      }
    } else {
      setTimeRange(val);
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.timeRange}>
        {earliest % 12 || 12}{' '}
        <span>{earliest < 12 ? 'AM' : 'PM'}</span>
        {' – '}
        {latest % 12 || 12}{' '}
        <span>{latest < 12 || latest === 24 ? 'AM' : 'PM'}</span>
      </p>
      <Slider
        max={maxValue}
        value={timeRange}
        onChange={handleChange}
        valueLabelDisplay="off"
        disableSwap
        marks={marks}
      />
      <p>Slide the begin and end times left and right.</p>
    </div>
  );
}
