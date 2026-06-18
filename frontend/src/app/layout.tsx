import type { Metadata } from 'next';
import { Rajdhani, Onest, Sometype_Mono } from 'next/font/google';
import './globals.css';
import { ToastProvider } from '@/components/Toasts';

const display = Rajdhani({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

const body = Onest({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

const mono = Sometype_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'ripple - on-chain AI counterfactual simulator',
  description:
    'State a single what-if. A Futurist AI projects a branching cascade of downstream consequences across distinct domains under validator consensus, settling a headline instability reading on GenLayer. The whole consequence tree, settled on-chain.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
