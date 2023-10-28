import Calendar from '@/components/Calendar'
import Header from '@/components/Header'
import TimezoneSelect from '@/components/TimezoneSelect'
import styles from '@/styles/pages/MeetingPage.module.scss'
import { sampleGradient } from '@/util/sampleGradient'
import { styleBuilder } from '@/util/styles'
import { intervalTimeString } from '@/util/time'
import { getCurrentTimezone } from '@/util/timezone'
import { Interval, Meeting, Respondent } from '@/util/types'
import { Checkbox, FormControlLabel } from '@mui/material'
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import Head from 'next/head'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'

export default function MeetingPage() {
  const db = getFirestore()

  const router = useRouter()
  const { meetingId } = router.query

  const [meeting, setMeeting] = useState<Meeting | null>()
  const [respondents, setRespondents] = useState<Respondent[] | null>()
  const [timezone, setTimezone] = useState<string>(getCurrentTimezone())
  const [inputtingName, setInputtingName] = useState(false)
  const [inputName, setInputName] = useState('')
  const [name, setName] = useState<string | null>(null)
  const [selectedIndices, setSelectedIndices] = useState<number[]>([])
  const [selectedRespondents, setSelectedRespondents] = useState<string[]>([])
  const [hoveredRespondent, setHoveredRespondent] = useState<string | null>(
    null
  )
  const [hoveredShade, setHoveredShade] = useState<number | null>(null)

  const [hoverInterval, setHoverInterval] = useState<Interval | null>(null)
  const [copied, setCopied] = useState(false)
  const [touching, setTouching] = useState(false)

  const nameRef = useRef<HTMLInputElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [saved, setSaved] = useState(true)

  // get meeting and respondents on start
  useEffect(() => {
    async function getMeeting() {
      if (meetingId === undefined) return
      // invalid meeting id
      if (typeof meetingId !== 'string') {
        setMeeting(null)
        setRespondents(null)
        return
      }
      // get meeting data
      const meetingRef = doc(db, 'meetings', meetingId.toLowerCase())
      const meetingDoc = await getDoc(meetingRef)
      if (!meetingDoc.exists()) {
        setMeeting(null)
        setRespondents(null)
        return
      }
      setMeeting(meetingDoc.data() as Meeting)
      // get respondents
      const respondentsRef = collection(meetingRef, 'respondents')
      const respondentsDocs = (await getDocs(respondentsRef)).docs
      const newRespondents = respondentsDocs.map(
        (doc) => doc.data() as Respondent
      )
      newRespondents.sort((a, b) => a.created - b.created)
      setRespondents(newRespondents)
    }
    getMeeting()
  }, [meetingId, db])

  // open changes will not be saved popup on close
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (saved) return
      e.preventDefault()
      return (e.returnValue = 'Changes you made may not be saved.')
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [saved])

  // copies invite link to clipboard
  async function copyLink() {
    if (!meeting) return
    await navigator.clipboard.writeText(`https://meetingbrew.com/${meeting.id}`)
    // show copy state
    if (copied) return
    setCopied(true)
    setTimeout(() => {
      setCopied(false)
    }, 2000)
  }

  // saves respondent in firebase
  const saveRespondent = useCallback(
    async (done?: boolean) => {
      setSaved(true)

      // return if invalid states
      if (!meeting || !name) throw new Error('saving in invalid state')
      const availability = selectedIndices.slice()

      // update local respondent
      setRespondents((respondents) => {
        if (!respondents) throw new Error('saving with undefined respondents')
        const newRespondents = respondents.slice()
        const rIndex = respondents.findIndex(
          (r) => r.name.toLowerCase() === name.toLowerCase()
        )
        if (rIndex === -1)
          throw new Error('saving respondent with invalid name')
        newRespondents[rIndex].availability = availability
        saveRespondentFirebase(newRespondents[rIndex].id)
        if (done) setName(null)
        return newRespondents
      })

      // update firebase respondent
      async function saveRespondentFirebase(id: string) {
        if (!meeting) throw new Error('saving in invalid state')
        const meetingId = meeting.id.toLowerCase()
        const respondentDocRef = doc(
          db,
          'meetings',
          meetingId,
          'respondents',
          id
        )
        await updateDoc(respondentDocRef, { availability, updated: Date.now() })
      }
    },
    [db, meeting, name, selectedIndices]
  )

  // handle autosave
  useEffect(() => {
    if (!name) return
    setSaved(false)
    const saveTimeout = setTimeout(saveRespondent, 1000)
    return () => clearTimeout(saveTimeout)
  }, [selectedIndices, name, saveRespondent])

  // focus name input on response start
  useEffect(() => {
    if (inputtingName) nameRef.current?.focus()
  }, [inputtingName])

  // creates a new respondent
  async function createRespondent() {
    // return if invalid states
    if (!meeting || !respondents) return
    // create respondent
    const meetingId = meeting.id.toLowerCase()
    const respondentsRef = collection(db, 'meetings', meetingId, 'respondents')
    const respondentDoc = doc(respondentsRef)
    const { id } = respondentDoc
    const respondent: Respondent = {
      id,
      name: inputName,
      availability: [],
      created: Date.now(),
    }
    // add user to local respondents
    const newRespondents = respondents.slice()
    newRespondents.push(respondent)
    setRespondents(newRespondents)
    setSelectedIndices([])
    // reset name input
    setName(inputName)
    setInputtingName(false)
    setInputName('')
    // add user to firebase respondents
    await setDoc(respondentDoc, respondent)
  }

  // saves input name as current respondent name
  async function saveName() {
    if (!respondents) return
    // return if input name not set
    if (!inputName) {
      window.alert('Please enter your name.')
      nameRef.current?.focus()
      return
    }
    // create respondent
    const rIndex = respondents.findIndex(
      (r) => r.name.toLowerCase() === inputName.toLowerCase()
    )
    if (rIndex === -1) createRespondent()
    else {
      setSelectedIndices(respondents[rIndex].availability)
      // reset name input
      setName(inputName)
      setInputtingName(false)
      setInputName('')
    }
  }

  // returns whether given respondent is inactive
  function respondentInactive(respondent: Respondent) {
    if (inputtingName) return true
    if (!!name && name.toLowerCase() !== respondent.name.toLowerCase())
      return true
    if (hoverInterval)
      return !respondent.availability.includes(hoverInterval.index)
    return false
  }

  // components shown when no meeting found
  function NoMeeting() {
    return (
      <div className={styles.noMeeting}>
        <h2>No meeting found!</h2>
        <Link href='/'>Go to home</Link>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <Head>
        <title>{meeting ? meeting.title : 'MeetingBrew'}</title>
      </Head>
      <Header className={styles.header} />
      <div className={styles.outerContent}>
        {meeting === null || respondents === null ? (
          <NoMeeting />
        ) : !meeting ? (
          <h2>Loading...</h2>
        ) : (
          <div className={styles.content} ref={contentRef}>
            <h1>{meeting.title}</h1>
            <div className={styles.options}>
              <div className={styles.buttons}>
                {inputtingName ? (
                  <button
                    className={styles.respondButton}
                    onClick={() => setInputtingName(false)}
                  >
                    <Image
                      src='/icons/backArrow.svg'
                      width='24'
                      height='24'
                      alt='backArrow.svg'
                    />
                    Cancel
                  </button>
                ) : name ? (
                  <button
                    className={styles.respondButton}
                    onClick={() => saveRespondent(true)}
                  >
                    <Image
                      src='/icons/check.svg'
                      width='24'
                      height='24'
                      alt='check.svg'
                    />
                    Done
                  </button>
                ) : (
                  <button
                    className={styles.respondButton}
                    onClick={() => setInputtingName(true)}
                  >
                    <Image
                      src='/icons/calendar.svg'
                      width='24'
                      height='24'
                      alt='calendar.svg'
                    />
                    Respond
                  </button>
                )}
                {!!name ? (
                  <span className={styles.savingSpan}>
                    {saved ? 'Saved' : 'Saving...'}
                  </span>
                ) : inputtingName ? (
                  <span className={styles.inviteButtonPlaceholder} />
                ) : (
                  <button
                    className={styleBuilder([
                      styles.inviteButton,
                      [styles.copied, copied],
                    ])}
                    onClick={copyLink}
                  >
                    {copied ? (
                      <>
                        <Image
                          src='/icons/checkdark.svg'
                          width='24'
                          height='24'
                          alt='link.svg'
                        />
                        Copied
                      </>
                    ) : (
                      <>
                        <Image
                          src='/icons/link.svg'
                          width='24'
                          height='24'
                          alt='link.svg'
                        />
                        Invite
                      </>
                    )}
                  </button>
                )}
              </div>
              <div
                className={styleBuilder([
                  styles.bigScreen,
                  styles.availability,
                  [styles.grayedOut, !!name || inputtingName],
                ])}
              >
                <p>{respondents ? `0/${respondents.length}` : '...'}</p>
                <div
                  className={styles.shades}
                  onMouseLeave={() => setHoveredShade(null)}
                >
                  {respondents &&
                    Array(respondents.length + 1)
                      .fill(0)
                      .map((v, i) => (
                        <div
                          className={styles.shade}
                          onMouseOver={() => setHoveredShade(i)}
                          style={{
                            background: sampleGradient(respondents.length)[i],
                          }}
                          key={i}
                        />
                      ))}
                </div>
                <p>
                  {respondents
                    ? `${respondents.length}/${respondents.length}`
                    : '...'}
                </p>
              </div>
              <TimezoneSelect
                className={styleBuilder([
                  styles.select,
                  [styles.grayedOut, inputtingName],
                ])}
                timezone={timezone}
                setTimezone={setTimezone}
              />
            </div>
            <p className={styles.info}>
              ⓘ If returning, enter same name to edit response
            </p>
            <div className={styles.content}>
              <div className={styles.respondents}>
                <p
                  className={styleBuilder([[styles.grayedOut, inputtingName]])}
                >
                  <Image
                    src='/icons/funnel.svg'
                    width='24'
                    height='24'
                    alt='funnel.svg'
                  />
                  {hoverInterval
                    ? intervalTimeString(hoverInterval)
                    : 'Respondents'}
                </p>
                {inputtingName && (
                  <div className={styles.nameInput}>
                    <input
                      ref={nameRef}
                      value={inputName}
                      onChange={(e) => setInputName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName()
                        if (e.key === 'Escape') setInputtingName(false)
                      }}
                      placeholder='Name'
                      maxLength={50}
                      spellCheck='false'
                    />
                    <button onClick={() => saveName()}>
                      <Image
                        src='/icons/check.svg'
                        width='24'
                        height='24'
                        alt='check.svg'
                      />
                    </button>
                  </div>
                )}
                {!respondents ? (
                  <p>Loading...</p>
                ) : !respondents.length && !inputtingName ? (
                  <p>No respondents yet.</p>
                ) : (
                  respondents.map((respondent, i) => (
                    <div
                      className={styleBuilder([
                        styles.respondent,
                        [styles.grayedOut, respondentInactive(respondent)],
                      ])}
                      key={i}
                    >
                      <FormControlLabel
                        className={styleBuilder([
                          styles.label,
                          [styles.notouch, inputtingName || !!name],
                        ])}
                        onMouseOver={() => {
                          if (touching) return
                          setHoveredRespondent(respondent.id)
                        }}
                        onMouseLeave={() => setHoveredRespondent(null)}
                        onTouchStart={() => {
                          setTouching(true)
                          setHoveredRespondent(null)
                        }}
                        onTouchEnd={() => setHoveredRespondent(null)}
                        sx={{
                          '.MuiTypography-root': {
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: '24px',
                            textOverflow: 'ellipsis',
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            wordBreak: 'break-word',
                            maxWidth: '278px',
                          },
                        }}
                        control={
                          <Checkbox
                            sx={{
                              padding: 0,
                              margin: '0 16px 0 24px',
                            }}
                            className={styleBuilder([
                              [
                                styles.grayedOut,
                                !!name &&
                                  name.toLowerCase() ===
                                    respondent.name.toLowerCase(),
                              ],
                            ])}
                            icon={
                              <Image
                                src='/icons/box.svg'
                                width='18'
                                height='18'
                                alt='box.svg'
                              />
                            }
                            checkedIcon={
                              <Image
                                src='/icons/boxchecked.svg'
                                width='18'
                                height='18'
                                alt='boxchecked.svg'
                              />
                            }
                            onChange={(e) => {
                              // update selected respondents
                              const newSelectedRespondents =
                                selectedRespondents.slice()
                              const rIndex = newSelectedRespondents.indexOf(
                                respondent.id
                              )
                              if (e.target.checked && rIndex === -1)
                                newSelectedRespondents.push(respondent.id)
                              if (!e.target.checked && rIndex !== -1)
                                newSelectedRespondents.splice(rIndex, 1)
                              setSelectedRespondents(newSelectedRespondents)
                            }}
                            disableRipple
                          />
                        }
                        label={respondent.name}
                      />
                    </div>
                  ))
                )}
              </div>
              <div
                className={styleBuilder([
                  styles.smallScreen,
                  styles.availability,
                  [styles.grayedOut, !!name || inputtingName],
                ])}
              >
                <p>{respondents ? `0/${respondents.length}` : '...'}</p>
                <div
                  className={styles.shades}
                  onMouseLeave={() => setHoveredShade(null)}
                >
                  {respondents &&
                    Array(respondents.length + 1)
                      .fill(0)
                      .map((v, i) => (
                        <div
                          className={styles.shade}
                          onMouseOver={() => setHoveredShade(i)}
                          style={{
                            background: sampleGradient(respondents.length)[i],
                          }}
                          key={i}
                        />
                      ))}
                </div>
                <p>
                  {respondents
                    ? `${respondents.length}/${respondents.length}`
                    : '...'}
                </p>
              </div>
              <div className={styles.calendar}>
                {name && (
                  <>
                    <p>
                      Click and drag to select times that you are available.
                    </p>
                    {meeting.type === 'dates' ? (
                      <Calendar
                        {...meeting}
                        datesType='dates'
                        currentTimezone={timezone}
                        type='select'
                        selectedIndices={selectedIndices}
                        setSelectedIndices={setSelectedIndices}
                      />
                    ) : (
                      <Calendar
                        {...meeting}
                        datesType='days'
                        currentTimezone={timezone}
                        type='select'
                        selectedIndices={selectedIndices}
                        setSelectedIndices={setSelectedIndices}
                      />
                    )}
                  </>
                )}
                {!name &&
                  !inputtingName &&
                  (meeting.type === 'dates' ? (
                    <Calendar
                      {...meeting}
                      datesType='dates'
                      currentTimezone={timezone}
                      type='display'
                      respondents={respondents}
                      selectedRespondents={selectedRespondents}
                      hoveredRespondent={hoveredRespondent}
                      hoveredShade={hoveredShade}
                      hoverInterval={hoverInterval}
                      setHoverInterval={setHoverInterval}
                    />
                  ) : (
                    <Calendar
                      {...meeting}
                      datesType='days'
                      currentTimezone={timezone}
                      type='display'
                      respondents={respondents}
                      selectedRespondents={selectedRespondents}
                      hoveredRespondent={hoveredRespondent}
                      hoveredShade={hoveredShade}
                      hoverInterval={hoverInterval}
                      setHoverInterval={setHoverInterval}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
