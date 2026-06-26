import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { ThemeProvider } from '@/components/providers/ThemeProvider';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Chen's Toronto Eats — restaurants I've visited & reviewed",
  description:
    "Chen's personal, interactive 3D map of the restaurants I've actually eaten at across downtown Toronto — with my own reviews, ratings, and notes. Not a finder; just my picks.",
  keywords: ['Toronto', 'restaurants', 'map', 'food', 'reviews', '3D map', "Chen's picks"],
  authors: [{ name: 'Chen' }],
  openGraph: {
    title: "Chen's Toronto Eats",
    description:
      "A personal 3D map of the restaurants Chen has visited and reviewed across downtown Toronto.",
    type: 'website',
  },
};

// Runs before first paint to apply the persisted theme, avoiding a flash for
// users who switched to light mode (the document otherwise ships `dark`).
const themeScript = `(function(){try{var s=localStorage.getItem('toronto-eats-store');var t='dark';if(s){var p=JSON.parse(s);if(p&&p.state&&p.state.theme){t=p.state.theme;}}var r=document.documentElement;if(t==='light'){r.classList.remove('dark');}else{r.classList.add('dark');}r.style.colorScheme=t;}catch(e){}})();`;

export const viewport: Viewport = {
  themeColor: '#08090c',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} dark`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-background font-sans text-foreground">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
