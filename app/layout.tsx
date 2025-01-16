import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import { Analytics } from '@vercel/analytics/react';

import { ProvidersAndLayout } from './ProvidersAndLayout';

const mondwest = localFont({
  src: [
    {
      path: '../public/fonts/PPMondwest-Regular.woff',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../public/fonts/PPMondwest-Bold.woff',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-mondwest-reg',
});

export const metadata: Metadata = {
  title: 'Walrus Photo Booth',
  description: 'Walrus Photo Booth',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en'>
      <body className={`${mondwest.variable} antialiased`}>
        <ProvidersAndLayout>{children}</ProvidersAndLayout>
        <Analytics />
      </body>
    </html>
  );
}
