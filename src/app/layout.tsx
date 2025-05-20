import './globals.css';
import { AuthProvider } from './auth-provider';

export const metadata = {
  title: 'Indus Creator Portal',
  description: 'Your Creator Dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
