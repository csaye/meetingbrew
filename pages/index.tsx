import Header from '@/components/Header';
import styles from '@/styles/pages/Index.module.scss';
import { getCurrentTimezone } from '@/util/timezone';
import { Meeting } from '@/util/types';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import Router from 'next/router';
import { useState } from 'react';
import TimezoneSelect from 'react-timezone-select';

const reservedIds = ['about'];

export default function Index() {
  const db = getFirestore();

  const [timezone, setTimezone] = useState<string>(getCurrentTimezone());
  const [title, setTitle] = useState('');
  const [id, setId] = useState('');
  const [earliest, setEarliest] = useState(earliestOptions[9]);
  const [latest, setLatest] = useState(latestOptions[16]);

  // creates a new meeting in firebase
  async function createMeeting() {
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
      id: meetingId,
      title,
      timezone,
      earliest: earliest.value,
      latest: latest.value,
      dates: []
    };
    await setDoc(meetingRef, meeting);
    Router.push(`/${meetingId}`);
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <h1>New Meeting</h1>
        <form onSubmit={e => {
          e.preventDefault();
          createMeeting();
        }}>
          <p>Timezone</p>
          <TimezoneSelect
            value={timezone}
            onChange={tz => setTimezone(tz.value)}
            instanceId="select-timezone"
          />
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <div>
            MeetingBrew.com/
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="ID (optional)"
            />
          </div>
          <button>
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
