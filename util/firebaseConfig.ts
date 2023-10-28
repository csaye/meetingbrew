import { getAnalytics, isSupported } from 'firebase/analytics'
import { getApps, initializeApp } from 'firebase/app'

// firebase web app config data
const firebaseConfig = {
  apiKey: 'AIzaSyD-ls3eXVDkiZf5VVG0nHn66-pMBfER0ao',
  authDomain: 'meetingbrew.firebaseapp.com',
  projectId: 'meetingbrew',
  storageBucket: 'meetingbrew.appspot.com',
  messagingSenderId: '166487103341',
  appId: '1:166487103341:web:606633337e79527f846c64',
  measurementId: 'G-YLPWVN6FVZ',
}

// initializes firebase
export async function initializeFirebase() {
  // return if already initialized
  if (getApps().length) return
  const app = initializeApp(firebaseConfig)
  // set up analytics if supported
  const supported = await isSupported()
  if (supported) getAnalytics(app)
}
