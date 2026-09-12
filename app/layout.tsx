import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Analytics } from "@vercel/analytics/next";
import { getSiteUrl } from "@/lib/site-url";

const inter = Inter({ subsets: ["latin"] });

const siteUrl = getSiteUrl();
const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Whisper";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${appName} — Anonymous Q&A for communities`,
    template: `%s · ${appName}`,
  },
  description:
    "Ask anything anonymously. Admins answer, answers are shareable. No accounts, no identity.",
  applicationName: appName,
  keywords: [
    "anonymous questions",
    "anonymous Q&A",
    "ask anonymously",
    "community Q&A",
    "tech careers",
    "anonymous feedback",
  ],
  authors: [{ name: appName }],
  creator: appName,
  publisher: appName,

  // Icons — full set from /public/assets/favicon_io/
  icons: {
    icon: [
      { url: "/assets/favicon_io/favicon.ico" },
      {
        url: "/assets/favicon_io/favicon-16x16.png",
        sizes: "16x16",
        type: "image/png",
      },
      {
        url: "/assets/favicon_io/favicon-32x32.png",
        sizes: "32x32",
        type: "image/png",
      },
    ],
    apple: [
      {
        url: "/assets/favicon_io/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
    other: [{ rel: "mask-icon", url: "/assets/favicon_io/favicon.ico" }],
  },

  // PWA manifest
  manifest: "/manifest.json",

  // Open Graph — used by WhatsApp, iMessage, Slack, Facebook
  openGraph: {
    type: "website",
    url: siteUrl,
    title: `${appName} — Anonymous Q&A for communities`,
    description:
      "Ask anything anonymously. Admins answer, answers are shareable. No accounts, no identity.",
    siteName: appName,
    images: [
      {
        url: "/og.svg",
        width: 1200,
        height: 630,
        alt: `${appName} — Anonymous Q&A`,
      },
    ],
    locale: "en_US",
  },

  // Twitter/X cards
  twitter: {
    card: "summary_large_image",
    title: `${appName} — Anonymous Q&A for communities`,
    description:
      "Ask anything anonymously. Admins answer, answers are shareable.",
    images: ["/og.svg"],
  },

  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // Canonical
  alternates: {
    canonical: siteUrl,
  },

  // Misc
  category: "technology",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0b" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: appName,
              url: siteUrl,
              description: "Anonymous Q&A for communities",
              applicationCategory: "SocialNetworkingApplication",
              operatingSystem: "Any",
              offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: "5",
                ratingCount: "1",
              },
            }),
          }}
        />
        <Analytics />
      </body>
    </html>
  );
}
