"use client";

// ================================
// 모델별 채팅 페이지 (동적 라우팅)
// ================================
// URL: /openai 또는 /upstage
// 각 모델별로 별도의 채팅 세션 유지

import { useParams, useRouter, notFound } from "next/navigation";
import { useEffect } from "react";
import ChatInterface from "@/components/ChatInterface";
import Sidebar from "@/components/Sidebar";
import { useChatStore } from "@/store/chat-store";
import { EmbeddingType } from "@/types";

// 유효한 모델 타입
const VALID_MODELS: EmbeddingType[] = ["openai", "upstage"];

export default function ModelPage() {
  const params = useParams();
  const router = useRouter();
  const { setEmbeddingType } = useChatStore();

  // URL 파라미터에서 모델 타입 추출
  const model = params.model as string;

  // 유효하지 않은 모델이면 404
  if (!VALID_MODELS.includes(model as EmbeddingType)) {
    notFound();
  }

  const embeddingType = model as EmbeddingType;

  // URL 변경 시 스토어 동기화
  useEffect(() => {
    setEmbeddingType(embeddingType);
  }, [embeddingType, setEmbeddingType]);

  // 모델 선택 시 URL 변경
  const handleModelSelect = (type: EmbeddingType) => {
    router.push(`/${type}`);
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* 사이드바 */}
      <Sidebar
        selectedEmbedding={embeddingType}
        onSelect={handleModelSelect}
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
      </main>
    </div>
  );
}
