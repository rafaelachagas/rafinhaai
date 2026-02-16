import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "Rafinha.AI",
  description: "Formação Profissional do Futuro - Plataforma de Membros",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('theme_preference');
                  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const isDark = saved === 'dark' || (!saved && systemDark);
                  if (isDark) {
                    document.documentElement.style.backgroundColor = '#0A0113';
                  } else {
                    document.documentElement.style.backgroundColor = '#f9fafb';
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <div style={{ background: 'red', color: 'white', fontWeight: 'bold', padding: '10px', textAlign: 'center', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }}>
            ARQUIVO DE LAYOUT ATUALIZADO (SE VOCÊ VÊ ISSO, O CÓDIGO ESTÁ CHEGANDO)
          </div>
          <div style={{ height: '40px' }} />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
