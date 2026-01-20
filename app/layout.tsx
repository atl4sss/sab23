import "./globals.css";
import { Manrope, Dancing_Script } from "next/font/google";

const sans = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sans",
});

const handwriting = Dancing_Script({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-hand",
});

export const metadata = {
  title: "Sab • 20",
  description: "Pixel birthday room",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${sans.variable} ${handwriting.variable}`}>{children}</body>
    </html>
  );
}
