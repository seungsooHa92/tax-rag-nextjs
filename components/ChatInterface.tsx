"use client";

// ================================
// ChatInterface 컴포넌트
// ================================
// 사용자와 AI가 대화하는 채팅 UI입니다.
// TanStack Query + Zustand로 상태 관리

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ChatRequest, ChatResponse, ModelType } from "@/types";
import { useChatStore } from "@/store/chat-store";

// ================================
// 모델 이름 매핑
// ================================

const MODEL_NAMES: Record<ModelType, string> = {
  openai: "OpenAI",
  upstage: "Upstage",
  "openai-pinecone": "OpenAI + Pinecone",
  "upstage-pinecone": "Upstage + Pinecone",
};

// ================================
// API 호출 함수
// ================================

async function sendMessage(
  query: string,
  modelType: ModelType
): Promise<ChatResponse> {
  const request: ChatRequest = { query, modelType };
  const { data } = await axios.post<ChatResponse>("/api/chat", request);
  return data;
}

// ================================
// ChatInterface 컴포넌트
// ================================

export default function ChatInterface() {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Zustand 스토어에서 상태 가져오기
  const { modelType, messagesByType, addMessage } = useChatStore();
  const messages = messagesByType[modelType];

  // ===== TanStack Query Mutation 설정 =====
  const mutation = useMutation({
    mutationFn: (query: string) => sendMessage(query, modelType),

    onSuccess: (data) => {
      addMessage({
        role: "assistant",
        content: data.answer,
      });
    },

    onError: (error: Error) => {
      console.error("API 호출 실패:", error);
      addMessage({
        role: "assistant",
        content: `죄송합니다. 답변 생성 중 오류가 발생했습니다. ${error.message}`,
      });
    },
  });

  // ===== 스크롤 자동 이동 =====
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== 메시지 전송 핸들러 =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addMessage({
      role: "user",
      content: input,
    });

    const query = input;
    setInput("");
    mutation.mutate(query);
  };

  // ===== 모델 표시 이름 =====
  const modelName = MODEL_NAMES[modelType];

  // ===== 렌더링 =====
  return (
    <div className="flex flex-col h-full bg-white">
      {/* ===== 헤더 ===== */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">소득세법 AI 상담</h2>
            <p className="text-sm text-blue-100 mt-1">
              RAG 기반 소득세 질의응답 시스템
            </p>
          </div>
          <div className="text-right">
            <span className="inline-block px-2 py-1 bg-blue-500 rounded text-xs">
              {modelName}
            </span>
          </div>
        </div>
      </div>

      {/* ===== 채팅 메시지 영역 ===== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* 초기 안내 메시지 */}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">안녕하세요!</p>
            <p className="text-sm">
              소득세에 관한 질문을 입력해주세요.
              <br />
              예: &quot;연봉 7천만원인 직장인의 소득세는 얼마인가요?&quot;
            </p>
            <p className="text-xs text-gray-400 mt-4">
              현재 {modelName} 모델을 사용합니다
            </p>
          </div>
        )}

        {/* 채팅 메시지 목록 */}
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${
              message.role === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[80%] rounded-lg px-4 py-3 ${
                message.role === "user"
                  ? "bg-blue-600 text-white"
                  : "bg-white border border-gray-200 text-gray-800"
              }`}
            >
              <div
                className={`text-xs mb-1 ${
                  message.role === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {message.role === "user" ? "나" : "AI 상담사"}
              </div>
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {/* 로딩 인디케이터 */}
        {mutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg px-4 py-3">
              <div className="text-xs text-gray-500 mb-1">AI 상담사</div>
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.1s" }}
                  />
                  <div
                    className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  />
                </div>
                <span className="text-gray-500 text-sm">
                  {modelName}로 검색 중...
                </span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ===== 입력 영역 ===== */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-4 bg-white"
      >
        <div className="flex space-x-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="소득세에 관한 질문을 입력하세요..."
            disabled={mutation.isPending}
            className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
          />
          <button
            type="submit"
            disabled={mutation.isPending || !input.trim()}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {mutation.isPending ? "전송 중..." : "전송"}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Enter 키를 누르거나 전송 버튼을 클릭하세요
        </p>
      </form>
    </div>
  );
}
