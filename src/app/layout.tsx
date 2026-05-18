import type { Metadata } from "next";
import "./globals.css";
import { DataProvider } from "@/lib/data-store";

export const metadata: Metadata = {
  title: "NTB Ops Dashboard | Hệ thống quản lý vận hành",
  description: "Dashboard vận hành khu vực NTB - Giám sát KPI, nhân sự & cảnh báo tự động",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body>
        <DataProvider>
          {children}
        </DataProvider>
      </body>
    </html>
  );
}
