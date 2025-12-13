import './globals.css'              
import Navbar from '@/components/Navbar.jsx'
import Footer from '@/components/Footer.jsx'
import Providers from '@/lib/providers/Providers'

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
        </Providers>
      </body>
    </html>
  )
}