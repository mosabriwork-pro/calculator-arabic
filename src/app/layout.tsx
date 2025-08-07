import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Navbar from '../components/Navbar'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'حاسبة لاعب كرة القدم - موصبري برو',
  description: 'حاسبة متقدمة لتخطيط النظام الغذائي للاعبين كرة القدم بناء على العمر والوزن والطول والمركز ومستوى النشاط. احصل على خطة غذائية مخصصة لتحقيق أهدافك الرياضية.',
  keywords: 'حاسبة غذائية, لاعب كرة القدم, تغذية رياضية, خطة غذائية, بروتين, كربوهيدرات, دهون, وزن مثالي, رياضة, كرة القدم العربية',
  authors: [{ name: 'موصبري برو' }],
  creator: 'موصبري برو المتقدمة',
  publisher: 'موصبري برو',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://mosabri.top'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'حاسبة لاعب كرة القدم - موصبري برو',
    description: 'حاسبة متقدمة لتخطيط النظام الغذائي للاعبين كرة القدم. احصل على خطة غذائية مخصصة لتحقيق أهدافك الرياضية.',
    url: 'https://mosabri.top',
    siteName: 'موصبري برو',
    images: [
      {
        url: '/greenlogo.png',
        width: 1200,
        height: 630,
        alt: 'حاسبة لاعب كرة القدم - موصبري برو',
      },
    ],
    locale: 'ar_SA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'حاسبة لاعب كرة القدم - موصبري برو',
    description: 'حاسبة متقدمة لتخطيط النظام الغذائي للاعبين كرة القدم',
    images: ['/greenlogo.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: 'your-google-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="icon" href="/favicon-large.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-large.png" />
        <link rel="icon" type="image/png" sizes="48x48" href="/favicon-large.png" />
        <link rel="icon" type="image/png" sizes="64x64" href="/favicon-large.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/favicon-large.png" />
        <link rel="apple-touch-icon" href="/favicon-large.png" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#1a472a" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="موصبري برو" />
        
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "حاسبة لاعب كرة القدم - موصبري برو",
              "description": "حاسبة متقدمة لتخطيط النظام الغذائي للاعبين كرة القدم",
              "url": "https://mosabri.top",
              "applicationCategory": "SportsApplication",
              "operatingSystem": "Web Browser",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "author": {
                "@type": "Organization",
                "name": "موصبري برو"
              }
            })
          }}
        />
      </head>
      <body className={inter.className}>
        <Navbar />
        <div style={{ paddingTop: '80px', margin: 0, paddingLeft: 0, paddingRight: 0, paddingBottom: 0 }}>
          {children}
        </div>
      </body>
    </html>
  )
} 