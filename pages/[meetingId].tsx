import Header from '@/components/Header';
import styles from '@/styles/pages/MeetingPage.module.scss';
import { useRouter } from 'next/router';

export default function MeetingPage() {
  const router = useRouter();

  const { meetingId } = router.query;

  return (
    <div className={styles.container}>
      <Header />
      <h1>{meetingId}</h1>
    </div>
  );
}
