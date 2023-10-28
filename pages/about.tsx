import Header from '@/components/Header'
import styles from '../styles/pages/About.module.scss'

export default function About() {
  return (
    <div className={styles.container}>
      <Header className={styles.header} />
      <div className={styles.outerContent}>
        <div className={styles.content}>
          <h1>MeetingBrew</h1>
          <p>
            MeetingBrew is a modern scheduling tool to help you find the best
            communal time to meet. It was built by two computer science students
            at the University of Michigan. Thank you for using MeetingBrew!
          </p>
          <div className={styles.contact}>
            <p>
              Contact us:{' '}
              <a href='mailto:hi@meetingbrew.com'>hi@meetingbrew.com</a>
            </p>
            <p>
              Star MeetingBrew on GitHub:{' '}
              <a href='https://github.com/csaye/meetingbrew' target='_blank' rel='noopener noreferrer'>
                github.com/csaye/meetingbrew
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
