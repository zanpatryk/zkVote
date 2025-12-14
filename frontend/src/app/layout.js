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
              className: '',
              style: {
                border: '2px solid #000',
                padding: '16px',
                color: '#000',
                borderRadius: '8px', 
                boxShadow: '4px 4px 0px 0px rgba(0,0,0,1)',
                background: '#fff',
                fontSize: '14px',
                fontWeight: '500', 
                fontFamily: 'serif',
                zIndex: 99999,
              },
              success: {
                iconTheme: {
                  primary: '#000',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#000',
                  secondary: '#fff',
                },
                duration: 5000,
              }
            }}
          />
        </Providers>
      </body>
    </html>
  )
}