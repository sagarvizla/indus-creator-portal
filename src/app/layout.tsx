import './globals.css';
import { AuthProvider } from './auth-provider'; // Assuming this path is correct
import { Inter } from 'next/font/google'; // Import Inter font from next/font

// Initialize Inter font with subsets
const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Indus Creator Portal',
  description: 'Your Creator Dashboard to manage YouTube channel data with ease.', // Made description more descriptive
  viewport: 'width=device-width, initial-scale=1', // Added viewport for responsiveness
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}> {/* Apply Inter font class to html tag */}
      <head>
        {/* You can add other head elements here if needed, e.g., favicons */}
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
