import '@/styles/globals.scss';
import { firebaseConfig } from '@/util/firebaseConfig';
import { getApps, initializeApp } from 'firebase/app';
import type { AppProps } from 'next/app';
import Head from 'next/head';

// initialize firebase
if (!getApps().length) initializeApp(firebaseConfig);

export default function App(props: AppProps) {
  const { Component, pageProps } = props;

  return (
    <>
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>MeetingBrew</title>
      </Head>
      <Component {...pageProps} />
    </>
  );
}
