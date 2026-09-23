import type { Metadata } from 'next'
import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Cintel — Events',
  description: 'Premium student events and registration platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
try {
  var savedTheme = window.localStorage.getItem('cintel-public-theme');
  document.documentElement.dataset.theme = savedTheme === 'light' ? 'light' : 'dark';
} catch (error) {
  document.documentElement.dataset.theme = 'dark';
}
            `,
          }}
        />
      </head>
      <body className={`${outfit.className} bg-background text-foreground antialiased selection:bg-brand/30 selection:text-brand`} suppressHydrationWarning>
        {children}
      </body>
    </html>
  )
}
