import './globals.css'
import Navbar from '@/components/Navbar.jsx'
import Footer from '@/components/Footer.jsx'
import Providers from '@/lib/providers/Providers'
import { Toaster } from 'react-hot-toast'

export const metadata = {
  title: 'zkVote',
  description: 'Decentralized voting system',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <Providers>
          <Navbar />

          <main className="pt-20">
            {children}
          </main>

          <Footer />
          <Toaster 
            position="bottom-right" 
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
                zIndex: 99999,
              },
              error: {
                duration: 5000,
              }
            }}
          />
        </Providers>
      </body>
    </html>
  )
}