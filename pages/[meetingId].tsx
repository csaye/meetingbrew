import Calendar from '@/components/Calendar';
import Header from '@/components/Header';
import TimezoneSelect from '@/components/TimezoneSelect';
import styles from '@/styles/pages/MeetingPage.module.scss';
import { sampleGradient } from '@/util/sampleGradient';
import { styleBuilder } from '@/util/styles';
import { intervalTimeString } from '@/util/time';
import { getCurrentTimezone } from '@/util/timezone';
import { Interval, Meeting, Respondent } from '@/util/types';
import { Checkbox, FormControlLabel } from '@mui/material';
import { collection, doc, getDoc, getDocs, getFirestore, setDoc, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef, useState } from 'react';

export default function MeetingPage() {
  const db = getFirestore();

  const router = useRouter();
  const { meetingId } = router.query;

  const [meeting, setMeeting] = useState<Meeting | null>();
  const [timezone, setTimezone] = useState<string>(getCurrentTimezone());
  const [respondents, setRespondents] = useState<Respondent[]>();
  const [inputtingName, setInputtingName] = useState(false);
  const [inputName, setInputName] = useState('');
  const [name, setName] = useState<string | null>(null);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [selectedRespondents, setSelectedRespondents] = useState<string[]>([]);
  const [hoveredRespondent, setHoveredRespondent] = useState<string | null>(null);
  const [hoveredShade, setHoveredShade] = useState<number | null>(null);

  const [width, setWidth] = useState(0);
  const [hoverInterval, setHoverInterval] = useState<Interval | null>(null);
  const [copied, setCopied] = useState(false);
  const [touching, setTouching] = useState(false);
  const [mounted, setMounted] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // retrieve respondents from firebase
  const getRespondents = useCallback(async () => {
    if (typeof meetingId !== 'string') return;
    const respondentsRef = collection(db, 'meetings', meetingId, 'respondents');
    const respondentsDocs = (await getDocs(respondentsRef)).docs;
    const respondentsData = respondentsDocs.map(doc => doc.data() as Respondent);
    respondentsData.sort((a, b) => a.created - b.created);
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
      const meetingData = meetingDoc.data() as Meeting;
      setMeeting(meetingData);
      // set document title
      document.title = `MeetingBrew - ${meetingData.title}`;
    }
    getMeeting();
  }, [meetingId, db]);

  // copies invite link to clipboard
  async function copyLink() {
    await navigator.clipboard.writeText(`https://meetingbrew.com/${meetingId}`);
    // show copy state
    if (copied) return;
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  }

  // returns index of respondent by name
  function respondentIndex(name: string) {
    if (!respondents) return -1;
    return respondents.findIndex(r => r.name.toLowerCase() === name.toLowerCase());
  }

  // saves respondent in firebase
  async function saveRespondent() {
    // return if invalid states
    if (typeof meetingId !== 'string' || !respondents || !name) return;
    // get respondent data
    const rIndex = respondentIndex(name);
    if (rIndex === -1) throw 'saving respondent with invalid name';
    const availability = selectedIndices.slice();
    // update local respondent
    const newRespondents = respondents.slice();
    newRespondents[rIndex].availability = availability;
    setRespondents(newRespondents);
    setName(null);
    // update firebase respondent
    const { id } = newRespondents[rIndex];
    const respondentDocRef = doc(db, 'meetings', meetingId, 'respondents', id);
    await updateDoc(respondentDocRef, { availability, updated: Date.now() });
  }

  // focus name input on response start
  useEffect(() => {
    if (inputtingName) nameRef.current?.focus();
  }, [inputtingName]);

  // creates a new respondent
  async function createRespondent() {
    // return if invalid states
    if (typeof meetingId !== 'string' || !respondents) return;
    // create respondent
    const respondentsRef = collection(db, 'meetings', meetingId, 'respondents');
    const respondentDoc = doc(respondentsRef);
    const { id } = respondentDoc;
    const respondent: Respondent = {
      id, name: inputName, availability: [], created: Date.now()
    };
    // add user to local respondents
    const newRespondents = respondents.slice();
    newRespondents.push(respondent);
    setRespondents(newRespondents);
    setSelectedIndices([]);
    // reset name input
    setName(inputName);
    setInputtingName(false);
    setInputName('');
    // add user to firebase respondents
    await setDoc(respondentDoc, respondent);
  }

  // saves input name as current respondent name
  async function saveName() {
    if (!respondents) return;
    // return if input name not set
    if (!inputName) {
      window.alert('Please enter your name.');
      nameRef.current?.focus();
      return;
    }
    // create respondent
    const rIndex = respondentIndex(inputName);
    if (rIndex === -1) createRespondent();
    else {
      setSelectedIndices(respondents[rIndex].availability);
      // reset name input
      setName(inputName);
      setInputtingName(false);
      setInputName('');
    }
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
  }, [meeting, respondents, mounted]);

  // returns whether given respondent is inactive
  function respondentInactive(respondent: Respondent) {
    if (inputtingName) return true;
    if (!!name && (name.toLowerCase() !== respondent.name.toLowerCase())) return true;
    if (hoverInterval) return !respondent.availability.includes(hoverInterval.index);
    return false;
  }

  // components shown when no meeting found
  function NoMeeting() {
    return (
      <div className={styles.noMeeting}>
        <h2>No meeting found!</h2>
        <Link href="/">Go to home</Link>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <Header width={width ? width : 952} />
      <div className={styles.outerContent}>
        {
          meeting === undefined ? <h2>Loading...</h2> : !meeting ? <NoMeeting /> : !respondents ? <h2>Loading...</h2> :
            <div className={styles.content} ref={contentRef}>
              <h1>{meeting.title}</h1>
              <div className={styles.options}>
                <div className={styles.buttons}>
                  {
                    inputtingName ?
                      <button
                        className={styles.respondButton}
                        onClick={saveName}
                      >
                        <Image src="/icons/continueArrow.svg" width="24" height="24" alt="check.svg" />
                        Continue
                      </button> :
                      name ?
                        <button
                          className={styles.respondButton}
                          onClick={saveRespondent}
                        >
                          <Image src="/icons/check.svg" width="24" height="24" alt="check.svg" />
                          Save
                        </button> :
                        <button
                          className={styles.respondButton}
                          onClick={() => setInputtingName(true)}
                        >
                          <Image src="/icons/calendar.svg" width="24" height="24" alt="calendar.svg" />
                          Respond
                        </button>
                  }
                  <button
                    className={styleBuilder([
                      styles.inviteButton,
                      [styles.copied, copied],
                      [styles.grayedOut, !!name || inputtingName]
                    ])}
                    onClick={copyLink}
                  >
                    {
                      copied ?
                        <>
                          <Image src="/icons/checkdark.svg" width="24" height="24" alt="link.svg" />
                          Copied
                        </> :
                        <>
                          <Image src="/icons/link.svg" width="24" height="24" alt="link.svg" />
                          Invite
                        </>
                    }
                  </button>
                </div>
                <div className={styleBuilder([
                  styles.bigScreen,
                  styles.availability,
                  [styles.grayedOut, !!name || inputtingName]
                ])}>
                  <p>0/{respondents.length}</p>
                  <div
                    className={styles.shades}
                    onMouseLeave={() => setHoveredShade(null)}
                  >
                    {
                      Array(respondents.length + 1).fill(0).map((v, i) =>
                        <div
                          className={styles.shade}
                          onMouseOver={() => setHoveredShade(i)}
                          style={{
                            background: sampleGradient(respondents.length)[i]
                          }}
                          key={i}
                        />
                      )
                    }
                  </div>
                  <p>{respondents.length}/{respondents.length}</p>
                </div>
                <TimezoneSelect
                  className={styleBuilder([
                    styles.select,
                    [styles.grayedOut, inputtingName]
                  ])}
                  timezone={timezone}
                  setTimezone={setTimezone}
                  onMounted={() => setMounted(true)}
                />
              </div>
              <div className={styles.content}>
                <div className={styles.respondents}>
                  <p className={styleBuilder([[styles.grayedOut, inputtingName]])}>
                    <Image src="/icons/funnel.svg" width="24" height="24" alt="funnel.svg" />
                    {hoverInterval ? intervalTimeString(hoverInterval) : 'Respondents'}
                  </p>
                  {
                    inputtingName &&
                    <input
                      className={styles.nameInput}
                      ref={nameRef}
                      value={inputName}
                      onChange={e => setInputName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveName() }}
                      placeholder="Name"
                      maxLength={50}
                      spellCheck="false"
                    />
                  }
                  {
                    (respondents.length || inputtingName) ?
                      respondents.map((respondent, i) =>
                        <div
                          className={styleBuilder([
                            styles.respondent,
                            [styles.grayedOut, respondentInactive(respondent)]
                          ])}
                          key={i}
                        >
                          <FormControlLabel
                            className={styleBuilder([
                              styles.label,
                              [styles.notouch, inputtingName || !!name]
                            ])}
                            onMouseOver={() => {
                              if (touching) return;
                              setHoveredRespondent(respondent.id);
                            }}
                            onMouseLeave={() => setHoveredRespondent(null)}
                            onTouchStart={() => {
                              setTouching(true);
                              setHoveredRespondent(null);
                            }}
                            onTouchEnd={() => setHoveredRespondent(null)}
                            sx={{
                              '.MuiTypography-root': {
                                fontFamily: "'DM Sans', sans-serif",
                                fontSize: '24px',
                                lineHeight: '24px'
                              }
                            }}
                            control={
                              <Checkbox
                                sx={{
                                  padding: 0, margin: '0 16px 0 24px'
                                }}
                                className={styleBuilder([
                                  [styles.grayedOut, !!name && (name.toLowerCase() === respondent.name.toLowerCase())]
                                ])}
                                icon={<Image src="/icons/box.svg" width="18" height="18" alt="box.svg" />}
                                checkedIcon={<Image src="/icons/boxchecked.svg" width="18" height="18" alt="boxchecked.svg" />}
                                onChange={e => {
                                  // update selected respondents
                                  const newSelectedRespondents = selectedRespondents.slice();
                                  const rIndex = newSelectedRespondents.indexOf(respondent.id);
                                  if (e.target.checked && rIndex === -1) newSelectedRespondents.push(respondent.id);
                                  if (!e.target.checked && rIndex !== -1) newSelectedRespondents.splice(rIndex, 1);
                                  setSelectedRespondents(newSelectedRespondents);
                                }}
                                disableRipple
                              />
                            }
                            label={respondent.name}
                          />
                        </div>
                      ) :
                      <p>No respondents yet.</p>
                  }
                </div>
                <div className={styleBuilder([
                  styles.smallScreen,
                  styles.availability,
                  [styles.grayedOut, !!name || inputtingName]
                ])}>
                  <p>0/{respondents.length}</p>
                  <div
                    className={styles.shades}
                    onMouseLeave={() => setHoveredShade(null)}
                  >
                    {
                      Array(respondents.length + 1).fill(0).map((v, i) =>
                        <div
                          className={styles.shade}
                          onMouseOver={() => setHoveredShade(i)}
                          style={{
                            background: sampleGradient(respondents.length)[i]
                          }}
                          key={i}
                        />
                      )
                    }
                  </div>
                  <p>{respondents.length}/{respondents.length}</p>
                </div>
                <div className={styles.calendar}>
                  {
                    name &&
                    <>
                      <p>Click and drag to select times that you are available.</p>
                      {
                        meeting.type === 'dates' ?
                          <Calendar
                            {...meeting}
                            datesType="dates"
                            currentTimezone={timezone}
                            type="select"
                            selectedIndices={selectedIndices}
                            setSelectedIndices={setSelectedIndices}
                          /> :
                          <Calendar
                            {...meeting}
                            datesType="days"
                            currentTimezone={timezone}
                            type="select"
                            selectedIndices={selectedIndices}
                            setSelectedIndices={setSelectedIndices}
                          />
                      }
                    </>
                  }
                  {
                    (!name && !inputtingName) &&
                    (
                      meeting.type === 'dates' ?
                        <Calendar
                          {...meeting}
                          datesType="dates"
                          currentTimezone={timezone}
                          type="display"
                          respondents={respondents}
                          selectedRespondents={selectedRespondents}
                          hoveredRespondent={hoveredRespondent}
                          hoveredShade={hoveredShade}
                          hoverInterval={hoverInterval}
                          setHoverInterval={setHoverInterval}
                        /> :
                        <Calendar
                          {...meeting}
                          datesType="days"
                          currentTimezone={timezone}
                          type="display"
                          respondents={respondents}
                          selectedRespondents={selectedRespondents}
                          hoveredRespondent={hoveredRespondent}
                          hoveredShade={hoveredShade}
                          hoverInterval={hoverInterval}
                          setHoverInterval={setHoverInterval}
                        />
                    )
                  }
                </div>
              </div>
            </div>
        }
      </div>
    </div>
  );
}
