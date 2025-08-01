"use-client"

import { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import ClientLayout from "./layout/ClientLayout";
import "./globals.css";
import ReduxProvider from "./context/ReduxProvider";
import { SessionProvider } from "./context/SessionProvider";
import { AppToaster } from "./@/components/ui-admin/toast";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Create Next App",
  description: "Generated by create next app",
};

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <ReduxProvider>
            <div className="flex min-h-screen">
              <div className="flex flex-col flex-1">
                <ClientLayout>{children}</ClientLayout>
                <AppToaster />
              </div>
            </div>
          </ReduxProvider>
        </SessionProvider>
      </body>
    </html>
  );
}