import NotFound from './[locale]/not-found'
import './[locale]/globals.css'

export default function RootNotFound() {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <NotFound />
      </body>
    </html>
  )
}
