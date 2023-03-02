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
              <div style={{ marginBottom: '24px' }}>
                <TimezoneSelect
                  value={timezone}
                  onChange={tz => setTimezone(tz.value)}
                  instanceId="select-timezone"
                />
              </div>
              <TimeRangeSlider
                timeRange={timeRange}
                setTimeRange={setTimeRange}
              />
            </div>
          </div>
          <div className={styles.flexContainer}>
            <div className={`${styles.flexItem} ${styles.flexFullWidth}`} style={{ maxWidth: '336px' }}>
              <div style={{ marginBottom: '48px' }}>
                <p style={{ fontWeight: '600', display: 'inline' }}>MeetingBrew.com/ </p>
                <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                  <input className={styles.idInput}
                    value={id}
                    onChange={e => setId(e.target.value)}
                    placeholder="custom ID (optional)"
                    onInput={(e) => {
                      // 100 char limit
                      if (e.target.value.length > 100) { e.target.value = e.target.value.slice(0, -1); }
                    }}
                    onKeyDown={(e) => {
                      if (!('abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789 Backspace ArrowLeft ArrowRight'.includes(e.key))) {
                        e.preventDefault();
                      }
                      if (e.key === ' ') {
                        // replace space with hyphen
                        e.preventDefault();
                        if (e.target.value.slice(-1) !== '-')
                          e.target.value = e.target.value + "-";
                        e.target.scrollLeft = e.target.scrollWidth;
                      }
                    }}
                  />
                </div>
                <p style={{ fontWeight: 200, color: 'var(--secondary-text)' }}>You can optionally set a custom id that will appear in the link of your MeetingBrew.</p>
              </div>
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
