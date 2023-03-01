import Calendar from '@/components/Calendar';
import Header from '@/components/Header';
import styles from '@/styles/pages/MeetingPage.module.scss';
import { getCurrentTimezone } from '@/util/timezone';
import { Meeting, Respondent } from '@/util/types';
import { collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import TimezoneSelect from 'react-timezone-select';

export default function MeetingPage() {
  const db = getFirestore();

  const router = useRouter();
  const { meetingId } = router.query;

  const [meeting, setMeeting] = useState<Meeting | null>();
  const [timezone, setTimezone] = useState<string>(getCurrentTimezone());
  const [respondents, setRespondents] = useState<Respondent[]>();

  // retrieve respondents from firebase
  const getRespondents = useCallback(async () => {
    if (typeof meetingId !== 'string') return;
    const respondentsRef = collection(db, 'meetings', meetingId, 'respondents');
    const respondentsDocs = (await getDocs(respondentsRef)).docs;
    const respondentsData = respondentsDocs.map(doc => doc.data() as Respondent);
    setRespondents(respondentsData);
  }, [meetingId, db]);

  // get respondents on start
  useEffect(() => {
    getRespondents();
  }, [getRespondents]);

  // get meeting on start
  useEffect(() => {
    async function getMeeting() {
      // handle invalid meeting id
      if (!meetingId) return;
      if (typeof meetingId !== 'string') {
        setMeeting(null);
        return;
      }
      // get meeting data
      const meetingRef = doc(db, 'meetings', meetingId);
      const meetingDoc = await getDoc(meetingRef);
      if (!meetingDoc.exists()) {
        setMeeting(null);
        return;
      }
      setMeeting(meetingDoc.data() as Meeting);
    }
    getMeeting();
  }, [meetingId, db]);

  // copies invite link to clipboard
  async function copyLink() {
    await navigator.clipboard.writeText(`https://meetingbrew.com/${meetingId}`);
    window.alert('Copied invite to clipboard!');
  }

  return (
    <div className={styles.container}>
      <Header />
      {
        meeting === undefined ? <p>Loading...</p> :
          !meeting ? <p>No meeting found</p> :
            <div className={styles.content}>
              <h1>{meeting.title}</h1>
              <button
                className={styles.inviteButton}
                onClick={copyLink}
              >
                <Image src="/icons/link.svg" width="24" height="24" alt="link.svg" />
                Invite
              </button>
              <TimezoneSelect
                value={timezone}
                onChange={tz => setTimezone(tz.value)}
                instanceId="select-currenttimezone"
              />
              <Calendar
                timezone={meeting.timezone}
                currentTimezone={timezone}
                dates={meeting.dates}
                earliest={meeting.earliest}
                latest={meeting.latest}
              />
            </div>
      }
    </div>
  );
}
