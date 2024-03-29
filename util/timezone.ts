import { allTimezones } from 'react-timezone-select'
import spacetime, { Spacetime } from 'spacetime'

const defaultTimezone = 'Etc/GMT'

// all timezone data
const timezones = Object.entries(allTimezones).map((zone) => {
  const now = spacetime.now(zone[0])
  const tz = now.timezone()
  return { name: tz.name, label: zone[1], offset: tz.current.offset }
})

// returns match score between given spacetime and given timezone
function tzScore(now: Spacetime, tz: { name: string; label: string }) {
  let score = 0
  // get timezone info
  const { name, label } = tz
  const tzName = name.toLowerCase()
  const tzLabel = label.toLowerCase()
  // get before and after slash timezone pieces
  const tzSlash = now.tz.indexOf('/')
  const beforeSlash = now.tz.slice(0, tzSlash)
  const afterSlash = now.tz.slice(tzSlash + 1)
  // calculate timezone score
  const nowTz = now.timezones[tzName]
  if (nowTz && !!nowTz.dst === now.timezone().hasDst) {
    if (tzName.indexOf(afterSlash) !== -1) score += 8
    if (tzLabel.indexOf(afterSlash) !== -1) score += 4
    if (tzName.indexOf(beforeSlash) !== -1) score += 2
    score += 1
  }
  return score
}

// returns closest match for given timezone string
function getTimezoneFuzzy(timezone: string) {
  // parse current time in given timezone
  let now: Spacetime
  try {
    now = spacetime.now(timezone)
  } catch (err) {
    return defaultTimezone
  }
  // filter timezones
  const nowOffset = now.timezone().current.offset
  let matchTimezones = timezones.filter((tz) => tz.offset === nowOffset)
  if (!matchTimezones.length) return defaultTimezone
  // get best timezone match
  return matchTimezones
    .map((tz) => ({ tz, score: tzScore(now, tz) }))
    .sort((a, b) => b.score - a.score)[0].tz.name
}

// returns current timezone string
export function getCurrentTimezone() {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  if (!timezone) return defaultTimezone
  if (timezones.map((tz) => tz.name).includes(timezone)) return timezone
  return getTimezoneFuzzy(timezone)
}

// converts a string timezone into a utc offset in minutes
export function timezoneToOffset(timezone: string) {
  const timezoneData = timezones.find((tz) => tz.name === timezone)
  if (timezoneData) return timezoneData.offset * 60
  return null
}
