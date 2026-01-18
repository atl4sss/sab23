import "./globals.css";

export const metadata = {
  title: "Саб • 20",
  description: "Pixel birthday room",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
