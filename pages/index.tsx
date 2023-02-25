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
      <Header />
      <div className={styles.content}>
        <h1>New Meeting</h1>
        <form onSubmit={e => {
          e.preventDefault();
        }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            placeholder="Title"
            required
          />
          <div>
            MeetingBrew.com/
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              placeholder="ID (optional)"
            />
          </div>
          <button>
            Create
          </button>
        </form>
      </div>
    </div>
  );
}
