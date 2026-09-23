import type { Metadata } from 'next'
import { Outfit, Bungee, Space_Mono } from 'next/font/google'
import Script from 'next/script'
import './globals.css'

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '700', '900'],
  variable: '--font-outfit',
})

const bungee = Bungee({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-bungee',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
})

export const metadata: Metadata = {
  title: 'Cintel — Events',
  description: 'Premium student events and registration platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="light" suppressHydrationWarning className={`${outfit.variable} ${bungee.variable} ${spaceMono.variable}`}>
      <body className="font-outfit bg-background text-foreground antialiased selection:bg-warning selection:text-foreground" suppressHydrationWarning>
        <Script id="theme-init" strategy="beforeInteractive">
          {`
try {
  var savedTheme = window.localStorage.getItem('cintel-public-theme');
  document.documentElement.dataset.theme = savedTheme === 'dark' ? 'dark' : 'light';
} catch (error) {
  document.documentElement.dataset.theme = 'light';
}
          `}
        </Script>
        {children}
      </body>
    </html>
  )
}
