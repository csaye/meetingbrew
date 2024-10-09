import DatesPicker from '@/components/DatesPicker'
import DaysPicker from '@/components/DaysPicker'
import Header from '@/components/Header'
import TimeRanges from '@/components/TimeRanges'
import TimezoneSelect from '@/components/TimezoneSelect'
import styles from '@/styles/pages/Index.module.scss'
import { selectStyles } from '@/util/styles'
import { getCurrentTimezone } from '@/util/timezone'
import { Meeting } from '@/util/types'
import TextareaAutosize from '@mui/base/TextareaAutosize'
import {
  collection,
  doc,
  getDoc,
  getFirestore,
  increment,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import Image from 'next/image'
import Router from 'next/router'
import { useEffect, useRef, useState } from 'react'
import Select from 'react-select'

// options for dates types
const datesOptions = [
  { value: 'dates', label: 'Specific Dates' },
  { value: 'days', label: 'Days of the Week' },
]

// ids that cannot be taken for meetings
const reservedIds = ['about']

export default function Index() {
  const db = getFirestore()

  const [timezone, setTimezone] = useState<string>(getCurrentTimezone())
  const [title, setTitle] = useState('')
  const [id, setId] = useState('')

  const [timeRange, setTimeRange] = useState<number[]>([9, 17])
  const [earliest, latest] = timeRange

  // Update state to store time ranges for each day
const [timeRanges, setTimeRanges] = useState<{ [day: string]: number[] }>({})

// Function to add a new time range for a new day
const addTimeRange = (day: string) => {
  setTimeRanges({ ...timeRanges, [day]: [9, 17] })
}

// Function to remove a time range for a specific day
const removeTimeRange = (day: string) => {
  const { [day]: _, ...rest } = timeRanges
  setTimeRanges(rest)
}

// Function to update a specific time range for a day
const updateTimeRange = (day: string, newRange: number[]) => {
  setTimeRanges({ ...timeRanges, [day]: newRange })
}

  const titleInput = useRef<HTMLTextAreaElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  const [datesOption, setDatesOption] = useState(datesOptions[0])
  const [dates, setDates] = useState<string[]>([])
  const [days, setDays] = useState<number[]>([])

  // Function to set days and manage time ranges
  const setDatesAndManageTimeRanges = (newDates: string[]) => {
    setDates(newDates)
    console.log(newDates)
    const newTimeRanges: { [day: string]: number[] } = {}
    newDates.forEach((day) => {
      if (!timeRanges[day]) {
        newTimeRanges[day] = [9, 17]
      } else {
        newTimeRanges[day] = timeRanges[day]
      }
    })
    // sort the time range keys
    const sortedTimeRanges: { [day: string]: number[] } = {}
    Object.keys(newTimeRanges)
      .sort()
      .forEach((key) => {
        sortedTimeRanges[key] = newTimeRanges[key]
      })
    setTimeRanges(sortedTimeRanges)
  }

  const setDaysAndManageTimeRanges = (newDays: number[]) => {
    setDays(newDays)
    const newTimeRanges: { [day: string]: number[] } = {}
    newDays.forEach((day) => {
      const dayString = day.toString()
      if (!timeRanges[dayString]) {
        newTimeRanges[dayString] = [9, 17]
      } else {
        newTimeRanges[dayString] = timeRanges[dayString]
      }
    })
    setTimeRanges(newTimeRanges)
  }

  const [mounted, setMounted] = useState(false)

  // set mounted on start
  useEffect(() => {
    setMounted(true)
  }, [])

  // focus title input on start
  useEffect(() => {
    titleInput.current?.focus()
  }, [])

  // creates a new meeting in firebase
  async function createMeeting() {
    // if no title given
    if (!title) {
      window.alert('Must enter a title.')
      titleInput.current?.focus()
      return
    }
    // if no dates selected
    if (datesOption.value === 'dates' && !dates.length) {
      window.alert('Must select at least one date.')
      return
    }
    // if too many dates selected
    if (datesOption.value === 'dates' && dates.length > 31) {
      window.alert('Too many dates selected. Maximum is 31.')
      return
    }
    // if no days selected
    if (datesOption.value === 'days' && !days.length) {
      window.alert('Must select at least one day.')
      return
    }
    const meetingsRef = collection(db, 'meetings')
    // check id
    if (id) {
      const idLower = id.toLowerCase()
      // check id availability
      const idReserved = reservedIds.includes(idLower)
      let idTaken = false
      if (!idReserved) {
        const meetingRef = doc(meetingsRef, idLower)
        const meetingDoc = await getDoc(meetingRef)
        idTaken = meetingDoc.exists()
      }
      // if id not available
      if (idReserved || idTaken) {
        window.alert('Meeting ID taken. Please choose another.')
        return
      }
    }
    // get meeting id
    const meetingId = id ? id : doc(meetingsRef).id.slice(0, 6).toLowerCase()
    const idLower = meetingId.toLowerCase()
    const meetingRef = doc(meetingsRef, idLower)
    const earliest = -1
    const latest = -1
    // create meeting
    const meetingBase = {
      id: meetingId,
      title,
      timezone,
      earliest,
      latest,
      timeRanges,
      created: Date.now(),
    }
    const meeting: Meeting =
      datesOption.value === 'dates'
        ? { ...meetingBase, type: 'dates', dates: dates.slice().sort() }
        : { ...meetingBase, type: 'days', days: days.slice().sort() }
    await setDoc(meetingRef, meeting)
    // increment meeting count
    const statsRef = doc(db, 'app', 'stats')
    await updateDoc(statsRef, { meetings: increment(1) })
    Router.push(`/${meetingId}`)
  }

// Render multiple TimeRangeSliders based on selected days
return (
  <div className={styles.container}>
    <Header className={styles.header} />
    <div className={styles.outerContent}>
      <div className={styles.content} ref={contentRef}>
        <TextareaAutosize
          className={styles.titleInput}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder='Event Title'
          ref={titleInput}
          wrap='hard'
          maxLength={100}
          onKeyDown={(e) => {
            if (e.key === 'Enter') e.preventDefault()
          }}
          spellCheck='false'
          data-gramm='false'
        />
        <div className={styles.datesTimes}>
          <div className={styles.dates}>
            <h2>Which dates?</h2>
            <p>Date Type</p>
            <Select
              className={styles.select}
              value={datesOption}
              onChange={(val) => {
                if (val) setDatesOption(val)
              }}
              options={datesOptions}
              styles={selectStyles}
              instanceId='select-dates'
            />
            {datesOption.value === 'dates' && mounted && (
              <DatesPicker dates={dates} setDates={setDatesAndManageTimeRanges} />
            )}
            {datesOption.value === 'days' && mounted && (
              <DaysPicker
                days={days}
                setDays={setDaysAndManageTimeRanges}
              />
            )}
          </div>
          <div className={styles.times}>
            <h2>Which times?</h2>
            <p>Timezone</p>
            <TimezoneSelect
              className={styles.select}
              timezone={timezone}
              setTimezone={setTimezone}
            />
            <TimeRanges timeRanges={timeRanges} updateTimeRange={updateTimeRange} />
          </div>
        </div>
        <div className={styles.options}>
          <div className={styles.idSection}>
            <div className={styles.idInput}>
              <p>MeetingBrew.com/ </p>
              <input
                value={id}
                onChange={(e) => {
                  let newId = e.target.value
                  newId = newId.replaceAll(/[^\w -]/g, '')
                  newId = newId.replaceAll(' ', '-')
                  newId = newId.replaceAll('--', '-')
                  setId(newId)
                }}
                placeholder='custom ID (optional)'
                maxLength={100}
                spellCheck='false'
              />
            </div>
            <p>
              You can optionally set a custom id that will appear in the link
              of your MeetingBrew.
            </p>
          </div>
          <button onClick={createMeeting}>
            <Image
              src='/icons/add.svg'
              width='24'
              height='24'
              alt='add.svg'
            />
            Create Event
          </button>
        </div>
      </div>
    </div>
  </div>
)}
