import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ManaRoom - Play Commander Online',
  description: 'Play Magic: The Gathering Commander with friends online',
  icons: {
    icon: '/manaroom-icon.png',
    apple: '/manaroom-icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen">{children}</body>
    </html>
  );
}
