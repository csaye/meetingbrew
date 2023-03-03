import DatesPicker from '@/components/DatesPicker';
import Header from '@/components/Header';
import TimeRangeSlider from '@/components/TimeRangeSlider';
import TimezoneSelect from '@/components/TimezoneSelect';
import styles from '@/styles/pages/Index.module.scss';
import { getCurrentTimezone } from '@/util/timezone';
import { Meeting } from '@/util/types';
import TextareaAutosize from '@mui/base/TextareaAutosize';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import Router from 'next/router';
import { useEffect, useRef, useState } from 'react';

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
  const [days, setDays] = useState<string[]>([]);

  // focus title input on start
  useEffect(() => {
    titleInput.current?.focus();
  }, []);

  // creates a new meeting in firebase
  async function createMeeting() {
    // if no title given
    if (!title) {
      window.alert('Please enter a title.');
      return;
    }
    // if no dates selected
    if (!dates.length) {
      window.alert('Please select at least one date.');
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
    const meeting: Meeting = {
      id: meetingId, title, timezone, earliest, latest, dates
    };
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
        <div
          ref={contentRef}
          className={styles.content}
        >
          <div className={styles.flexContainer}>
            <div className={styles.flexItem} style={{ flexGrow: 1 }}>
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
            </div>
          </div>
          <div className={styles.flexContainer}>
            <div className={styles.flexItem}>
              <h2 style={{ marginBottom: '12px' }}>Which dates?</h2>
              <p style={{ color: 'var(--secondary-text)' }}>Date Type</p>
              <div style={{ marginBottom: '12px' }}>
                <TimezoneSelect
                  value={timezone}
                  onChange={tz => setTimezone(tz.value)}
                  instanceId="select-timezone"
                />
              </div>
              <div style={{ marginBottom: '48px' }}>
                <DatesPicker
                  dates={dates}
                  setDates={setDates}
                />
              </div>
            </div>
            <div className={styles.flexItem}>
              <h2 style={{ marginBottom: '12px' }}>Which times?</h2>
              <p style={{ color: 'var(--secondary-text)' }}>Timezone</p>
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
          <div className={styles.flexContainer}>
            <div className={styles.flexItem} style={{ maxWidth: '336px' }}>
              <div style={{ marginBottom: '48px' }}>
                <p style={{ fontWeight: '600', display: 'inline' }}>MeetingBrew.com/ </p>
                <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                  <input className={styles.idInput}
                    value={id}
                    onChange={e => {
                      let newId = e.target.value;
                      newId = newId.replaceAll(/[^\w -]/g, '');
                      newId = newId.replaceAll(' ', '-');
                      setId(newId);
                    }}
                    placeholder="custom ID (optional)"
                    maxLength={100}
                  />
                </div>
                <p style={{ fontWeight: 200, color: 'var(--secondary-text)' }}>You can optionally set a custom id that will appear in the link of your MeetingBrew.</p>
              </div>
              <button onClick={createMeeting}>
                <Image src="/icons/add.svg" width="24" height="24" alt="add.svg" />
                Create Event
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
