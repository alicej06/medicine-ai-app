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
      {/* Added the gradient here so it applies globally if pages are transparent */}
      <body className="bg-gradient-to-br from-slate-900 via-slate-800 to-teal-900 min-h-screen text-white font-sans selection:bg-cyan-500/30">
        <Navbar />
        {children}
      </body>
    </html>
  );
}