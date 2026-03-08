import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "삼일PwC 온라인 NPL 플랫폼",
  description: "NPL 매각·인수 거래 프로세스를 디지털화하여 거래 투명성과 운영 효율성을 높입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.min.css"
        />
      </head>
      <body style={{ fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {children}
      </body>
    </html>
  );
}
