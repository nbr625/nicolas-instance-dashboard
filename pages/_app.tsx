import '../styles/globals.css';
import type { AppProps } from 'next/app';
import dynamic from 'next/dynamic';
import { useEffect } from 'react';

function MyAppContent({ Component, pageProps }: AppProps) {
  useEffect(() => {
    import('chartjs-adapter-date-fns')
      .then(() => console.log('chartjs-adapter-date-fns loaded'))
      .catch((err) => console.error('Error loading chartjs-adapter-date-fns:', err));
  }, []);

  return <Component {...pageProps} />;
}

const NoSSRApp = dynamic(() => Promise.resolve(MyAppContent), {
  ssr: false,
});

export default function MyApp(props: AppProps) {
  return <NoSSRApp {...props} />;
}
