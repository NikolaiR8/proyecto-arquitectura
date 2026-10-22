import type { Metadata } from "next";
import { DM_Sans } from 'next/font/google';
import "./globals.css";
import { AuthProvider } from "./context/AuthContext";
import Navbar from "./components/general/Navbar";
import { TooltipProvider } from "./components/ui/tooltip";

import Footer from "./components/general/Footer";

const dmSans = DM_Sans({ subsets: ['latin'], weight: ['400', '600', '700'] });

export const metadata: Metadata = {
  title: "CanchasDioguinho - Reserva y Pago de Canchas de Fútbol 5",
  description: "Sistema de reservas y pago online para canchas sintéticas de fútbol 5",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="shortcut icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
      </head>
      <body className={`${dmSans.className} bg-slate-50 min-h-screen text-gray-900 antialiased relative flex flex-col justify-between`}>
        {/* Subtle global background texture using stadium wallpaper with high opacity overlay */}
        <div
          aria-hidden="true"
          className="fixed inset-0 pointer-events-none z-0 bg-cover bg-center opacity-[0.035] filter saturate-50"
          style={{ backgroundImage: "url('/stadium-bg.jpg')" }}
        />
        <div className="relative z-10 flex-1 flex flex-col">
          <AuthProvider>
            <TooltipProvider>
              <Navbar />
              <div className="flex-1">
                {children}
              </div>
              <Footer />
            </TooltipProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}
