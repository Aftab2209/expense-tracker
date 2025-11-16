import type React from "react"
import type { Metadata } from "next"
import { Poppins } from 'next/font/google'
import { Analytics } from "@vercel/analytics/next"
import { ThemeProvider } from "@/contexts/theme-context"
import { AuthProvider } from "@/contexts/auth-context"
import "./globals.css"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: "Finance Dashboard",
  description: "Your personal finance dashboard",
  generator: "v0.app",
  manifest: "/manifest.json",
  icons: {
    icon: [
      {
        url: "/icons/ic_launcher.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icons/ic_launcher.png",
        media: "(prefers-color-scheme: dark)",
      }
      
    ],
    apple: "/icons/ic_launcher.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} font-sans antialiased`}>
        <AuthProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  )
}
