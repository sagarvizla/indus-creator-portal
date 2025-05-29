import './globals.css';
import { AuthProvider } from './auth-provider';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Indus Creator Portal',
  description: 'Your Creator Dashboard to manage YouTube channel data with ease.',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}