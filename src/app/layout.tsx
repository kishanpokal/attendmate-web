import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AttendMate | Smart Attendance tracking",
  description: "Ultra-premium attendance tracking platform designed for the modern world.",
  keywords: ["attendance", "tracker", "premium", "dashboard", "analytics"],
  authors: [{ name: "AttendMate Team" }],
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="scroll-smooth">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const theme = localStorage.getItem('theme');
                const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                const activeTheme = theme || systemTheme;
                if (activeTheme === 'dark') {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body
        className={`${inter.variable} ${outfit.variable} antialiased selection:bg-indigo-500/30 selection:text-indigo-900 dark:selection:text-indigo-100`}
      >
        <AuthProvider>
          <div className="relative min-h-screen">
            {/* Background Aura Elements */}
            <div className="aura-bg">
              <div className="aura-blob w-[40vw] h-[40vw] max-w-[800px] max-h-[800px] -top-[10%] -left-[10%] bg-indigo-500 animate-float" />
              <div className="aura-blob w-[35vw] h-[35vw] max-w-[700px] max-h-[700px] top-[20%] -right-[5%] bg-purple-500 animate-float [animation-delay:-5s]" />
              <div className="aura-blob w-[45vw] h-[45vw] max-w-[900px] max-h-[900px] -bottom-[10%] left-[20%] bg-blue-500 animate-float [animation-delay:-10s]" />
            </div>
            
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}

