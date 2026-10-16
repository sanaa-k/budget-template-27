export const metadata = { title: 'Budget Template', description: 'Track your monthly budget.' }
export const viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover' }

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700&family=Figtree:wght@400;500;600&display=swap" rel="stylesheet" />
        <link rel="stylesheet" href={'/budget.css?v=' + (process.env.VERCEL_GIT_COMMIT_SHA || Date.now())} />
      </head>
      <body>{children}</body>
    </html>
  )
}
