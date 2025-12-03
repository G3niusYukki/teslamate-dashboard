import './globals.css'

export const metadata = {
  title: 'TeslaMate Dashboard',
  description: 'Modern Visualization for TeslaMate',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
