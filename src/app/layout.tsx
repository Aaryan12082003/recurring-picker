import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReCall - Recurring Event Picker",
  description: "Create and manage recurring events with powerful RRule logic",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
