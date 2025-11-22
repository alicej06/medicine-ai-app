// apps/web/src/app/layout.tsx
import './globals.css';
import Navbar from '../components/Navbar';

export const metadata = {
  title: 'Medicine Explainer',
  description: 'Understand your meds.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 min-h-screen text-slate-900 font-sans">
        {/* The Navbar sits at the top */}
        <Navbar />
        
        {/* The page content sits below */}
        {children}
      </body>
    </html>
  );
}