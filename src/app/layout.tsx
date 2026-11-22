import type { Metadata } from 'next';
import { Newsreader, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const newsreader = Newsreader({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-newsreader',
  display: 'swap',
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jakarta',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-jetbrains',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://marrow-web-production.up.railway.app'),
  title: 'Marrow — Multi-Agent Deliberation & Evidence-Graph Skeleton',
  description:
    'One declarative multi-agent cross-examination and evidence-graph skeleton powering Postmortem Court and Defense Tribunal.',
  openGraph: {
    title: 'Marrow — One Deliberation Skeleton. Two Unforgiving Arenas.',
    description:
      'Declarative multi-agent cross-examination, cited causal graphs, and MongoDB dossier persistence powering Postmortem Court and Defense Tribunal.',
    images: [{ url: '/images/marrow-og.png', width: 1600, height: 900, alt: 'Marrow Skeleton Architecture' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${newsreader.variable} ${jakarta.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-screen antialiased selection:bg-[#E5484D]/25 selection:text-inherit">
        {children}
      </body>
    </html>
  );
}
