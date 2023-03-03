import { Dispatch } from 'react';
import TimezoneSelectBase from 'react-timezone-select';

type Props = {
  timezone: string;
  setTimezone: Dispatch<string>;
  className?: string;
};

export default function TimezoneSelect(props: Props) {
  const { timezone, setTimezone, className } = props;

  return (
    <TimezoneSelectBase
      className={className}
      value={timezone}
      onChange={tz => setTimezone(tz.value)}
      instanceId="select-timezone"
      styles={{
        control: baseStyles => ({
          ...baseStyles,
          height: '48px',
          borderRadius: 0,
          background: '#f0f0f0',
          border: '1px solid #d0d0d0'
        }),
        singleValue: baseStyles => ({
          ...baseStyles,
          fontWeight: 700,
          color: '#666'
        })
      }}
    />
  );
}
