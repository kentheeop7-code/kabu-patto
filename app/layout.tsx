import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "株ぱっと | 株価と株主優待がひと目でわかる",
  description: "日本株の最新株価・最低投資額・株主優待・事業内容をシンプルに確認できます。",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
