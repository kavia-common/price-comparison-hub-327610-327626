import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Price Comparison Hub",
  description:
    "Compare prices across multiple e-commerce sources by product name or URLs.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
