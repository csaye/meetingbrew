import { getAnalytics, isSupported } from 'firebase/analytics'
import { getApps, initializeApp } from 'firebase/app'

// firebase web app config data
const firebaseConfig = {
  apiKey: '',
  authDomain: 'meetingbrew.firebaseapp.com',
  projectId: 'meetingbrew',
  storageBucket: 'meetingbrew.appspot.com',
  messagingSenderId: '',
  appId: '',
  measurementId: '',
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
