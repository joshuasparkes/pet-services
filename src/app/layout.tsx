import type { Metadata } from "next";
import { Raleway } from "next/font/google";
import "./globals.css";

const raleway = Raleway({
  variable: "--font-raleway",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Bournville Pet Care | Professional Dog Walking & Pet Care in Bournville, Birmingham",
  description: "Trusted pet care services in Bournville and surrounding Birmingham areas. Professional dog walking, pet sitting, and home visits by Isabel Sparkes. Fully insured and DBS checked. Book your pet care today!",
  icons: {
    icon: '/doglogo.jpg',
    shortcut: '/doglogo.jpg',
    apple: '/doglogo.jpg',
  },
  keywords: [
    "dog walking Bournville",
    "pet sitting Birmingham", 
    "pet care Bournville",
    "dog walker Selly Oak",
    "pet services Kings Norton",
    "dog walking Birmingham",
    "pet sitting Cotteridge",
    "animal care Bournville",
    "Isabel Sparkes pet services",
    "trusted pet care Birmingham"
  ],
  authors: [{ name: "Isabel Sparkes" }],
  creator: "Isabel Sparkes",
  publisher: "Bournville Pet Care",
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
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://bournvillepetservices.co.uk',
    title: 'Bournville Pet Care | Professional Dog Walking & Pet Care',
    description: 'Trusted pet care services in Bournville and surrounding Birmingham areas. Professional dog walking, pet sitting, and home visits.',
    siteName: 'Bournville Pet Care',
    images: [
      {
        url: '/doglogo.jpg',
        width: 800,
        height: 800,
        alt: 'Bournville Pet Care - Professional Pet Care',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bournville Pet Care | Professional Dog Walking & Pet Care',
    description: 'Trusted pet care services in Bournville and surrounding Birmingham areas.',
    images: ['/doglogo.jpg'],
  },
  alternates: {
    canonical: 'https://bournvillepetservices.co.uk',
  },
  other: {
    'geo.region': 'GB-BIR',
    'geo.placename': 'Bournville, Birmingham',
    'geo.position': '52.4184;-1.9317',
    'ICBM': '52.4184, -1.9317',
    'business:contact_data:street_address': 'Bournville',
    'business:contact_data:locality': 'Birmingham',
    'business:contact_data:region': 'West Midlands',
    'business:contact_data:postal_code': 'B30',
    'business:contact_data:country_name': 'United Kingdom',
    'business:contact_data:phone_number': '+447590566769',
    'business:contact_data:email': 'isabel.sparkes@hotmail.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=AW-310709348"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'AW-310709348');
            `,
          }}
        />
      </head>
      <body
        className={`${raleway.variable} font-raleway antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
