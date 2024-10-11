import styles from "@/styles/pages/Index.module.scss";
import TimeRangeSlider from "@/components/TimeRangeSlider";

type Props = {
    timeRanges: { [day: string]: number[] },
    updateTimeRange: (day: string, newRange: number[]) => void,
    datesOption?: { label: string; value: string } | { label: string; value: string }
};


function DayCard(props: { day: string }) {
    const {day} = props;

    let month = null;
    let date = null;

    if (day.length > 1) {
        month = new Date(day).toLocaleString('default', {month: 'short'});
        date = new Date(day).getDate();
    } else {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        date = daysOfWeek[Number(day)];
    }

    return (
        <div className={styles.calendarIcon}>
            <div className={styles.month}>{month}</div>
            <div className={styles.day}>{date}</div>
        </div>
    );
}

export default function TimeRanges(props: Props) {
    const {timeRanges, updateTimeRange} = props;

    return (
        <>

            {Object.keys(timeRanges).map((day) => (
                <div key={day} className={styles.timeRange}>
                    <DayCard key={day} day={day}/>
                    <TimeRangeSlider
                        timeRange={timeRanges[day]}
                        setTimeRange={(newRange) => updateTimeRange(day, newRange)}
                    />
                </div>
            ))}
        </>
    )
}