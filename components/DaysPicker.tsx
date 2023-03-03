import { styleBuilder } from '@/util/styles';
import Image from 'next/image';
import { Dispatch, useCallback, useEffect, useState } from 'react';
import styles from '../styles/components/DaysPicker.module.scss';

type Props = {
  days: number[];
  setDays: Dispatch<number[]>;
};

export default function DaysPicker(props: Props) {
  const { days, setDays } = props;

  const [dragAdd, setDragAdd] = useState(true);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

  // called on drag end
  const finishDrag = useCallback(() => {
    if (dragStart === null || dragEnd === null) return;
    // calculate drag range
    const minDay = Math.min(dragStart, dragEnd);
    const maxDay = Math.max(dragStart, dragEnd);
    // update days
    const newDays = days.slice();
    for (let day = minDay; day <= maxDay; day++) {
      const dayIndex = newDays.indexOf(day);
      if (dragAdd && dayIndex === -1) newDays.push(day);
      if (!dragAdd && dayIndex !== -1) newDays.splice(dayIndex, 1);
    }
    setDays(newDays);
    // clear drag positions
    setDragStart(null);
    setDragEnd(null);
  }, [days, dragAdd, dragEnd, dragStart, setDays]);

  // listen for mouse up to finish drag
  useEffect(() => {
    window.addEventListener('mouseup', finishDrag);
    return () => window.removeEventListener('mouseup', finishDrag);
  }, [finishDrag]);

  // returns whether given day is selected
  function daySelected(day: number) {
    if (!dragAdd && dragStart !== null && dragEnd !== null) {
      // calculate drag range
      const minDay = Math.min(dragStart, dragEnd);
      const maxDay = Math.max(dragStart, dragEnd);
      if (day >= minDay && day <= maxDay) return false;
    }
    if (days.includes(day)) return true;
    // if dragging to add
    if (dragStart === null || dragEnd === null) return false;
    const minDay = Math.min(dragStart, dragEnd);
    const maxDay = Math.max(dragStart, dragEnd);
    return day >= minDay && day <= maxDay;
  }

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
              className={styleBuilder([
                styles.day,
                [styles.selected, daySelected(i)]
              ])}
              onMouseDown={() => {
                setDragAdd(!days.includes(i));
                setDragStart(i);
                setDragEnd(i);
              }}
              onMouseOver={() => {
                if (dragStart === null) return;
                setDragEnd(i);
              }}
              key={i}
            >
              {
                daySelected(i) &&
                <Image
                  src="/icons/check.svg"
                  width="24"
                  height="24"
                  alt="check.svg"
                  draggable="false"
                />
              }
            </div>
          )
        }
      </div>
      <p>Click and drag to select day ranges.</p>
    </div>
  );
}
