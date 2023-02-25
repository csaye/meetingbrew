import Header from '@/components/Header';
import styles from '@/styles/pages/Index.module.scss';
import { Meeting } from '@/util/types';
import { collection, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore';
import { useState } from 'react';

export default function Index() {
  const db = getFirestore();

  const [title, setTitle] = useState('');
  const [id, setId] = useState('');

  return (
    <div className={styles.container}>
      <h1>MeetingBrew</h1>
    </div>
  );
}
