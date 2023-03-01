import DatesPicker from '@/components/DatesPicker';
import Header from '@/components/Header';
import TimeRangeSlider from '@/components/TimeRangeSlider';
import styles from '@/styles/pages/Index.module.scss';
import { getCurrentTimezone } from '@/util/timezone';
import { Meeting } from '@/util/types';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import Image from 'next/image';
import Router from 'next/router';
import { useState, useRef, useEffect } from 'react';
import TimezoneSelect from 'react-timezone-select';
import TextareaAutosize from '@mui/base/TextareaAutosize';

const reservedIds = ['about'];

export default function Index() {
  const db = getFirestore();

  const [timezone, setTimezone] = useState<string>(getCurrentTimezone());
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [dates, setDates] = useState<string[]>([]);

  const [timeRange, setTimeRange] = useState<number[]>([9, 17]);
  const [earliest, latest] = timeRange;

  const titleInput = useRef()

  useEffect(() => {
    titleInput.current?.focus()
  }, [])

  // creates a new meeting in firebase
  async function createMeeting() {
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

  return (
    <div className={styles.container}>
      <Header width={1140} />
      <div className={styles.content}>
        <form onSubmit={e => {
          e.preventDefault();
          createMeeting();
        }}>
          <div className={styles.flexContainer}>
            <div className={`${styles.flexItem} ${styles.flexFullWidth}`}>
              <TextareaAutosize className={styles.titleInput}
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Event Title"
                required
                ref={titleInput}
                wrap="hard"
                onInput={(e) => {
                  // 100 char limit
                  if (e.target.value.length > 100) { e.target.value = e.target.value.slice(0, -1); }
                  // autoresize
                  // e.target.style.height = '0';
                  // e.target.style.height = e.target.scrollHeight + "px";
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                  }
                }}
                data-gramm="false"
                data-gramm_editor="false"
                data-enable-grammarly="false"
                spellcheck="false" />
            </div>
          </div>
          <div className={styles.flexContainer}>
            <div className={styles.flexItem}>
              <h2>Which dates?</h2>
              <DatesPicker
                dates={dates}
                setDates={setDates}
              />
            </div>
            <div className={styles.flexItem}>
              <h2>Which times?</h2>
              <p>Timezone</p>
              <TimezoneSelect
                value={timezone}
                onChange={tz => setTimezone(tz.value)}
                instanceId="select-timezone"
              />
              <TimeRangeSlider
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
          </div>
          <div className={styles.flexContainer}>
            <div className={`${styles.flexItem} ${styles.flexFullWidth}`}>
              <p className={styles.paragraph} style={{ display: 'inline' }}>MeetingBrew.com/ </p>
              <input
                value={id}
                onChange={e => setId(e.target.value)}
                placeholder="ID (optional)"
              />
              <button>
                <Image src="/icons/add.svg" width="24" height="24" alt="add.svg" />
                Create Event
              </button>
            </div>
          </div>
        </form>
      </div >
    </div >
  );
}
