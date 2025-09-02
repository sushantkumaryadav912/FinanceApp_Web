import "./globals.css";
import { Inter } from 'next/font/google'

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter'
})

export const metadata = {
  title: "Finance Risk & Compliance Dashboard",
  description: "Track expenses, manage risks, and ensure financial compliance with real-time analytics and automated auditing.",
  keywords: ["finance", "expenses", "compliance", "risk management", "analytics", "dashboard"],
  authors: [{ name: "Sushant" }],
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="antialiased bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
