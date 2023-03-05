import DatesPicker from '@/components/DatesPicker';
import DaysPicker from '@/components/DaysPicker';
import Header from '@/components/Header';
import TimeRangeSlider from '@/components/TimeRangeSlider';
import TimezoneSelect from '@/components/TimezoneSelect';
import styles from '@/styles/pages/Index.module.scss';
import { selectStyles } from '@/util/styles';
import { getCurrentTimezone } from '@/util/timezone';
import { Meeting } from '@/util/types';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import Router from 'next/router';
import { useEffect, useRef, useState } from 'react';
import Select from 'react-select';

// options for dates types
const datesOptions = [
  { value: 'dates', label: 'Specific Dates' },
  { value: 'days', label: 'Days of the Week' }
];

// ids that cannot be taken for meetings
const reservedIds = ['about'];

export default function Index() {
  const db = getFirestore();

  const [timezone, setTimezone] = useState<string>(getCurrentTimezone());
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [width, setWidth] = useState(0);

  const [timeRange, setTimeRange] = useState<number[]>([9, 17]);
  const [earliest, latest] = timeRange;

  const titleInput = useRef<HTMLTextAreaElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const [datesOption, setDatesOption] = useState(datesOptions[0]);
  const [dates, setDates] = useState<string[]>([]);
  const [days, setDays] = useState<number[]>([]);

  // focus title input on start
  useEffect(() => {
    titleInput.current?.focus();
  }, []);

  // creates a new meeting in firebase
  async function createMeeting() {
    // if no title given
    if (!title) {
      window.alert('Must enter a title.');
      titleInput.current?.focus();
      return;
    }
    // if no dates selected
    if (datesOption.value === 'dates' && !dates.length) {
      window.alert('Must select at least one date.');
      return;
    }
    // if no days selected
    if (datesOption.value === 'days' && !days.length) {
      window.alert('Must select at least one day.');
      return;
    }
    const meetingsRef = collection(db, 'meetings');
    // check id
    if (id) {
      // check id availability
      const idReserved = reservedIds.includes(id);
      let idTaken = false;
      if (!idReserved) {
        const meetingRef = doc(meetingsRef, id);
        const meetingDoc = await getDoc(meetingRef);
        idTaken = meetingDoc.exists();
      }
      // if id not available
      if (idReserved || idTaken) {
        window.alert('Meeting ID taken. Please choose another.');
        return;
      }
    }
    // get meeting id
    const meetingId = id ? id : doc(meetingsRef).id.slice(0, 6);
    const meetingRef = doc(meetingsRef, meetingId);
    // create meeting
    const meetingBase = { id: meetingId, title, timezone, earliest, latest, created: Date.now() };
    const meeting: Meeting = datesOption.value === 'dates' ?
      { ...meetingBase, type: 'dates', dates: dates.slice().sort() } :
      { ...meetingBase, type: 'days', days: days.slice().sort() };
    await setDoc(meetingRef, meeting);
    Router.push(`/${meetingId}`);
  }

  // set up content resize listener
  useEffect(() => {
    function onResize() {
      if (!contentRef.current) return;
      setWidth(contentRef.current.offsetWidth);
    }
    if (!contentRef.current) return;
    setWidth(contentRef.current.offsetWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <div className={styles.container}>
      <Header width={width} />
      <div className={styles.outerContent}>
        <div className={styles.content} ref={contentRef}>
          <TextareaAutosize
            className={styles.titleInput}
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Event Title"
            ref={titleInput}
            wrap="hard"
            maxLength={100}
            onKeyDown={e => {
              // prevent enter key
              if (e.key === 'Enter') e.preventDefault();
            }}
            spellCheck="false"
            data-gramm="false"
          />
          <div className={styles.datesTimes}>
            <div className={styles.dates}>
              <h2>Which dates?</h2>
              <p>Date Type</p>
              <Select
                className={styles.select}
                value={datesOption}
                onChange={val => {
                  if (val) setDatesOption(val);
                }}
                options={datesOptions}
                styles={selectStyles}
                instanceId="select-dates"
              />
              {
                datesOption.value === 'dates' &&
                <DatesPicker dates={dates} setDates={setDates} />
              }
              {
                datesOption.value === 'days' &&
                <DaysPicker days={days} setDays={setDays} />
              }
            </div>
            <div className={styles.times}>
              <h2>Which times?</h2>
              <p>Timezone</p>
              <TimezoneSelect
                className={styles.select}
                timezone={timezone}
                setTimezone={setTimezone}
              />
              <TimeRangeSlider
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
          </div>
          <div className={styles.options}>
            <div className={styles.idSection}>
              <div className={styles.idInput}>
                <p>MeetingBrew.com/ </p>
                <input
                  value={id}
                  onChange={e => {
                    // clean up input id
                    let newId = e.target.value;
                    newId = newId.replaceAll(/[^\w -]/g, '');
                    newId = newId.replaceAll(' ', '-');
                    setId(newId);
                  }}
                  placeholder="custom ID (optional)"
                  maxLength={100}
                  spellCheck="false"
                />
              </div>
              <p>You can optionally set a custom id that will appear in the link of your MeetingBrew.</p>
            </div>
            <button onClick={createMeeting}>
              <Image src="/icons/add.svg" width="24" height="24" alt="add.svg" />
              Create Event
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
