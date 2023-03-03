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
      <div className={styles.headings}>
        {
          ['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) =>
            <div className={styles.heading} key={i}>
              <h4>{d}</h4>
            </div>
          )
        }
      </div>
      <div className={styles.days}>
        {
          Array(7).fill(null).map((v, i) =>
            <div
              onMouseDown={() => {
                const newDays = days.slice();
                const dayIndex = days.indexOf(i);
                if (dayIndex === -1) newDays.push(i);
                else newDays.splice(dayIndex, 1);
                setDays(newDays);
              }}
              className={styleBuilder([
                styles.day,
                [styles.selected, days.includes(i)]
              ])}
              key={i}
            >
              {
                days.includes(i) &&
                <Image src="/icons/check.svg" width="24" height="24" alt="check.svg" />
              }
            </div>
          )
        }
      </div>
    </div>
  );
}
