import Header from '@/components/Header';
import styles from '@/styles/pages/Index.module.scss';
import { Meeting } from '@/util/types';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { useState } from 'react';

const reservedIds = ['about'];

export default function Index() {
  const db = getFirestore();

  const [title, setTitle] = useState('');
  const [id, setId] = useState('');

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
    const meeting: Meeting = { title, id: meetingId };
    await setDoc(meetingRef, meeting);
  }

  return (
    <div className={styles.container}>
      <Header />
      <div className={styles.content}>
        <h1>New Meeting</h1>
        <form onSubmit={e => {
          e.preventDefault();
        }}>
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
