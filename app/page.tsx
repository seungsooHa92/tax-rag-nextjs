"use client";

// ================================
// 메인 페이지
// ================================
// 소득세법 AI 상담 서비스의 메인 페이지입니다.
// Sidebar와 ChatInterface를 조합하여 렌더링합니다.
//
// [상태 관리] - Zustand
// - 임베딩별로 대화 내용 별도 저장
// - 임베딩 변경 시 대화 유지

import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import { useChatStore } from "@/store/chat-store";

export default function Home() {
  const { embeddingType, setEmbeddingType } = useChatStore();

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <Sidebar
        selectedEmbedding={embeddingType}
        onSelect={setEmbeddingType}
      />

      {/* 메인 콘텐츠 */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* 상단 헤더 */}
        <header className="bg-white border-b border-gray-200 px-6 py-3">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-semibold text-gray-800">
                소득세법 AI 상담
              </h1>
              <p className="text-xs text-gray-500">
                RAG 기반 질의응답 시스템
              </p>
            </div>
            <div className="flex gap-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                Next.js
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                LangChain.js
              </span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                {embeddingType === "openai" ? "OpenAI" : "Upstage"}
              </span>
            </div>
          </div>
        </header>

        {/* 채팅 영역 */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface />
        </div>

        {/* 푸터 */}
        <footer className="bg-white border-t border-gray-200 px-6 py-2 text-center text-xs text-gray-500">
          이 서비스는 학습 목적으로 만들어졌습니다. 실제 법률 상담은 전문가에게 문의하세요.
        </footer>
      </main>
    </div>
  );
}
