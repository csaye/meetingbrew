import { styleBuilder } from '@/util/styles';
import Image from 'next/image';
import { Dispatch } from 'react';
import styles from '../styles/components/DaysPicker.module.scss';

type Props = {
  days: number[];
  setDays: Dispatch<number[]>;
};

export default function DaysPicker(props: Props) {
  const { days, setDays } = props;

  return (
    <div className={styles.container}>
    </div>
  );
}
