import Image from 'next/image';
import Link from 'next/link';
import Router from 'next/router';
import styles from '../styles/components/Header.module.scss';

type Props = {
  width: number;
};

export default function Header(props: Props) {
  const { width } = props;

  return (
    <div className={styles.container}>
      <div
        className={styles.innerContainer}
        style={{ width: width ? width : undefined }}
      >
        <Link href="/">
          {
            width ? (
              width < 576 ?
                <Image src="/img/logosmall.svg" width="36" height="36" alt="logosmall.svg" priority /> :
                <Image src="/img/logo.svg" width="218" height="36" alt="logo.svg" priority />
            ) :
              <>
                <Image src="/img/logosmall.svg" width="36" height="36" alt="logosmall.svg" className={styles.logoSmall} priority />
                <Image src="/img/logo.svg" width="218" height="36" alt="logo.svg" className={styles.logo} priority />
              </>
          }
        </Link>
        <span style={{ flexGrow: 1 }} />
        <button onClick={() => Router.push('/')}>
          <Image src="/icons/add.svg" width="24" height="24" alt="add.svg" />
          New Event
        </button>
      </div>
    </div>
  );
}
