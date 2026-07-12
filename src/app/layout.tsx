import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://attendmateweb.vercel.app"),
  title: {
    default: "AttendMate — Smart College Attendance Tracker",
    template: "%s · AttendMate",
  },
  description:
    "Track your college attendance, calculate exactly how many classes you can skip, and never fall below the 75% requirement. Free attendance calculators and tools for students.",
  keywords: [
    "attendance tracker",
    "attendance calculator",
    "75 percent attendance",
    "college attendance",
    "bunk calculator",
    "how many classes can I skip",
    "student tools",
  ],
  authors: [{ name: "AttendMate" }],
  openGraph: {
    title: "AttendMate — Smart College Attendance Tracker",
    description:
      "Track attendance, calculate safe skips, and stay above 75%. Free tools for college students.",
    url: "https://attendmateweb.vercel.app",
    siteName: "AttendMate",
    type: "website",
  },
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
        {/* AdSense is loaded only on public content pages (via PublicShell),
            never on the app or auth screens — AdSense policy compliance. */}
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
        className={`${inter.variable} font-sans antialiased bg-[#f9fafb] dark:bg-[#111827] text-[#111827] dark:text-[#f9fafb] selection:bg-indigo-500/20`}
      >
        <AuthProvider>
          {children}
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
