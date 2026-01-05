// ================================
// 메인 페이지
// ================================
// 소득세법 AI 상담 서비스의 메인 페이지입니다.
// ChatInterface 컴포넌트를 렌더링합니다.
//
// [Next.js App Router 특징]
// - app/page.tsx는 루트 경로(/)에 해당하는 페이지
// - Server Component가 기본값 (필요시 "use client" 추가)
// - 이 페이지는 ChatInterface를 렌더링만 하므로 Server Component로 유지

import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <main className="min-h-screen py-8 px-4">
      {/* 페이지 제목 */}
      <div className="max-w-3xl mx-auto mb-6">
        <h1 className="text-3xl font-bold text-gray-800 text-center">
          📚 소득세법 AI 상담
        </h1>
        <p className="text-gray-600 text-center mt-2">
          RAG (Retrieval-Augmented Generation) 기반 AI 상담 서비스
        </p>

        {/* 기술 스택 배지 */}
        <div className="flex justify-center gap-2 mt-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
            Next.js
          </span>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-xs rounded-full">
            LangChain.js
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
            OpenAI
          </span>
          <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
            TanStack Query
          </span>
        </div>
      </div>

      {/* 채팅 인터페이스 */}
      <ChatInterface />

      {/* 푸터 */}
      <footer className="max-w-3xl mx-auto mt-6 text-center text-sm text-gray-500">
        <p>
          이 서비스는 학습 목적으로 만들어졌습니다.
          <br />
          실제 법률 상담은 전문가에게 문의하세요.
        </p>
      </footer>
    </main>
  );
}
