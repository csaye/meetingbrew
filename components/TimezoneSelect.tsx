import { selectStyles } from '@/util/styles';
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
      styles={selectStyles}
    />
  );
}
