import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { RoleProvider } from "@/contexts/RoleContext";
import I18nProvider from "@/components/I18nProvider";
import ErrorBoundary from "@/components/ErrorBoundary";

export const metadata: Metadata = {
  title: "HarvestHub",
  description: "Developed By Group of Aprodhite",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&family=Poppins:wght@400;500;600;700;800;900&family=Pacifico&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased isolate font-poppins">
        <ErrorBoundary>
          <I18nProvider>
            <AuthProvider>
              <RoleProvider>
                {children}
              </RoleProvider>
            </AuthProvider>
          </I18nProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
