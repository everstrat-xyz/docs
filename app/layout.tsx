import { RootProvider } from "fumadocs-ui/provider/next";
import type { Metadata } from "next";
import localFont from "next/font/local";
import { AnalyticsConsent } from "@/components/analytics-consent";
import { siteConfig } from "@/lib/config";
import { rootMetadata } from "@/lib/metadata";
import { getSiteJsonLd, JsonLd } from "@/lib/structured-data";
import "./global.css";

const inter = localFont({
  src: "./fonts/inter-latin-variable.woff2",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  ...rootMetadata,
};

export default function Layout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang={siteConfig.locale}
      className={inter.className}
      suppressHydrationWarning
    >
      <body className="flex flex-col min-h-screen">
        <JsonLd data={getSiteJsonLd()} />
        <RootProvider>{children}</RootProvider>
        <AnalyticsConsent />
      </body>
    </html>
  );
}
