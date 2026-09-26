import type { Metadata, Viewport } from "next";
import { APP_CONFIG } from "@/config/app";
import "@/app/globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/context/ThemeContext";
import { TierProvider } from "@/context/TierContext";
import { AuthProvider } from "@/context/AuthContext";
import UpgradeModal from "@/components/shared/UpgradeModal";

export const metadata: Metadata = {
  title: {
    default: APP_CONFIG.name,
    template: `%s | ${APP_CONFIG.name}`,
  },
  description: APP_CONFIG.description,
  manifest: "/manifest.json",
  openGraph: {
    title: APP_CONFIG.name,
    description: APP_CONFIG.description,
    url: APP_CONFIG.url,
    siteName: APP_CONFIG.name,
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: APP_CONFIG.themeColor,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ThemeProvider>
          <TooltipProvider>
            <AuthProvider>
              <TierProvider>
                <main className="min-h-screen w-full flex flex-col">{children}</main>
                <UpgradeModal />
              </TierProvider>
            </AuthProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
