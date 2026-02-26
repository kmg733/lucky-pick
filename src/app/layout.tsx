import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lucky Pick - 추첨 게임",
  description: "재미있고 공정한 추첨 게임 모음. 상품 추첨, 이름 추첨, 번호 뽑기, 사다리 타기를 즐겨보세요.",
};

// SECURITY: themeScript는 정적 문자열 리터럴이며, 동적 사용자 입력을 포함하지 않습니다.
// localStorage 값은 스크립트 실행 시 읽히며, 스크립트 문자열 구성에 사용되지 않습니다.
// NOTE: 유효한 테마 값('light'/'dark')은 ThemeContext.tsx의 VALID_THEMES와 동기화 필수
const themeScript = `
  (function() {
    try {
      var theme = localStorage.getItem('lucky-pick-theme');
      if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        document.documentElement.classList.add('dark');
      }
    } catch (e) {}
  })();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-50 dark:bg-slate-900`}
      >
        <ThemeProvider>
          <Header />
          <main className="flex-1">
            {children}
          </main>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
