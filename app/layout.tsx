// ================================
// Root Layout
// ================================
// Next.js App Router의 루트 레이아웃입니다.
// 모든 페이지에 공통으로 적용되는 레이아웃을 정의합니다.
//
// [역할]
// 1. HTML 구조 정의 (<html>, <body>)
// 2. 전역 스타일 적용 (globals.css)
// 3. Provider 설정 (TanStack Query)
// 4. 메타데이터 정의

import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

// ================================
// 메타데이터 설정
// ================================
// SEO 및 페이지 정보를 위한 메타데이터
export const metadata: Metadata = {
  title: "소득세법 AI 상담 | RAG 기반 챗봇",
  description:
    "LangChain과 OpenAI를 활용한 RAG 기반 소득세법 AI 상담 서비스입니다.",
};

// ================================
// 루트 레이아웃 컴포넌트
// ================================
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        {/* TanStack Query Provider로 감싸기 */}
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
