import type { ReactNode } from "react";
import type { Metadata } from "next";
import "./styles/foundation.css";
import "./styles/brand-navigation.css";
import "./styles/responsive-layout.css";
import "./styles/navigation-state.css";
import "./styles/navigation-indicator.css";
import "./styles/theme.css";
import "./styles/hero-slider.css";
import "./styles/commodities.css";
import "./styles/workflow.css";
import "./styles/routing.css";
import "./styles/about-footer.css";
import "./styles/scan.css";
import "./styles/results.css";
import "./styles/auth.css";
import "./styles/commodity-stability.css";
import "./styles/dashboard-mobile.css";
import "./styles/brand-identity.css";
import "./styles/pastel-green-theme.css";
import "./styles/typography.css";
export const metadata: Metadata = {
  title: {
    default: "HASILTANI — Setiap Panen Punya Jalur",
    template: "%s | HASILTANI",
  },
  description:
    "Kelola, pantau, dan salurkan hasil tani dengan lebih mudah melalui satu platform terintegrasi.",
  applicationName: "HASILTANI",
  icons: {
    icon: "/brand/identity-mascot.png",
    shortcut: "/brand/identity-mascot.png",
    apple: "/brand/identity-mascot.png",
  },
  openGraph: {
    title: "HASILTANI — Setiap Panen Punya Jalur. Setiap Hasil Punya Nilai.",
    description:
      "Analisis kondisi hasil tani, temukan jalur pemanfaatan, dan lihat nilai potensial dalam satu pengalaman terintegrasi.",
    images: ["/brand/hero-slides/slide-komoditas.png"],
    type: "website",
  },
};

const themeBootstrap = `
(function () {
  try {
    var saved = localStorage.getItem('hasiltani-theme');
    var theme = saved === 'dark' || saved === 'light'
      ? saved
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (e) {
    document.documentElement.dataset.theme = 'light';
    document.documentElement.style.colorScheme = 'light';
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
