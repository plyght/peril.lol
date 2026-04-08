import type { Metadata, Viewport } from "next";
import { EB_Garamond } from "next/font/google";
import "./globals.css";

const ebGaramond = EB_Garamond({
  variable: "--font-eb-garamond",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
    { media: "(prefers-color-scheme: light)", color: "#f5f3ef" },
  ],
};

export const metadata: Metadata = {
  title: "plyght",
  description: "I write code, wrestle, and lift heavy things.",
  metadataBase: new URL("https://peril.lol"),
  openGraph: {
    title: "plyght",
    description: "I write code, wrestle, and lift heavy things.",
    images: [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "plyght",
    description: "I write code, wrestle, and lift heavy things.",
    images: ["/og-image.png"],
  },
  icons: {
    icon: [
      { url: "/logo-white.svg", type: "image/svg+xml" },
    ],
    apple: [
      { url: "/logo-white.svg" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${ebGaramond.variable} min-h-[100dvh] antialiased`}>
        {children}
      </body>
    </html>
  );
}
