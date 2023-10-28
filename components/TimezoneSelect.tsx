import { selectStyles } from '@/util/styles'
import { Dispatch, useEffect, useState } from 'react'
import TimezoneSelectBase from 'react-timezone-select'

type Props = {
  timezone: string
  setTimezone: Dispatch<string>
  className?: string
  onMounted?: () => void
}

export default function TimezoneSelect(props: Props) {
  const { timezone, setTimezone, className, onMounted } = props

  const [mounted, setMounted] = useState(false)

  // set mounted on start
  useEffect(() => {
    setMounted(true)
  }, [])

  // call on mounted function
  useEffect(() => {
    if (mounted && onMounted) onMounted()
  }, [mounted, onMounted])

  // return if not mounted
  if (!mounted)
    return (
      <div className={className} style={{ width: '336px', height: '48px' }} />
    )

  return (
    <TimezoneSelectBase
      className={className}
      value={timezone}
      onChange={(tz) => setTimezone(tz.value)}
      instanceId='select-timezone'
      styles={selectStyles}
    />
  )
}
