import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vaccine Schedule Builder — For Physicians",
  description:
    "A clinical tool for physicians to generate state-specific, CDC-compliant childhood vaccine schedules for patient counseling.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-gray-50 min-h-screen text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
