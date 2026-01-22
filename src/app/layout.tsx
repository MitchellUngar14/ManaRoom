import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ManaRoom - Play Commander Online',
  description: 'Play Magic: The Gathering Commander with friends online',
  manifest: '/manifest.json',
  icons: {
    icon: '/manaroom-icon.png',
    apple: '/manaroom-icon.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ManaRoom',
  },
};

export const viewport: Viewport = {
  themeColor: '#c9a227',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
