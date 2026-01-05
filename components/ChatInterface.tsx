"use client";

// ================================
// ChatInterface 컴포넌트
// ================================
// 사용자와 AI가 대화하는 채팅 UI입니다.
// TanStack Query를 사용하여 API 호출을 관리합니다.
//
// [주요 기능]
// 1. 사용자 입력 받기
// 2. API 호출 (useMutation)
// 3. 채팅 히스토리 표시
// 4. 로딩 상태 표시
//
// [TanStack Query 사용 이유]
// - 로딩/에러 상태 자동 관리
// - 캐싱 기능
// - 재시도 로직
// - TypeScript 타입 안전성

import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { ChatMessage, ChatRequest, ChatResponse } from "@/types";

// ================================
// API 호출 함수
// ================================
// axios를 사용하여 BE의 /api/chat 엔드포인트를 호출합니다.

async function sendMessage(query: string): Promise<ChatResponse> {
  const request: ChatRequest = { query };

  // POST /api/chat 호출
  const { data } = await axios.post<ChatResponse>("/api/chat", request);

  return data;
}

// ================================
// ChatInterface 컴포넌트
// ================================

export default function ChatInterface() {
  // ===== 상태 관리 =====
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // ===== TanStack Query Mutation 설정 =====
  // useMutation: 데이터를 변경하는 비동기 작업에 사용
  // useQuery는 데이터 조회용, useMutation은 생성/수정/삭제용
  const mutation = useMutation({
    // mutationFn: 실제 API 호출 함수
    mutationFn: sendMessage,

    // onSuccess: API 호출 성공 시 실행
    onSuccess: (data) => {
      // AI 응답을 채팅 히스토리에 추가
      const assistantMessage: ChatMessage = {
        role: "assistant",
        content: data.answer,
      };
      setMessages((prev) => [...prev, assistantMessage]);
    },

    // onError: API 호출 실패 시 실행
    onError: (error) => {
      console.error("API 호출 실패:", error);

      // 에러 메시지를 채팅 히스토리에 추가
      const errorMessage: ChatMessage = {
        role: "assistant",
        content: "죄송합니다. 답변 생성 중 오류가 발생했습니다. 다시 시도해주세요.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    },
  });

  // ===== 스크롤 자동 이동 =====
  // 새 메시지가 추가되면 자동으로 스크롤을 맨 아래로 이동
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // ===== 메시지 전송 핸들러 =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 빈 입력이면 무시
    if (!input.trim()) return;

    // 사용자 메시지를 채팅 히스토리에 추가
    const userMessage: ChatMessage = {
      role: "user",
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);

    // 입력 필드 초기화
    const query = input;
    setInput("");

    // API 호출 (mutation 실행)
    mutation.mutate(query);
  };

  // ===== 렌더링 =====
  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* ===== 헤더 ===== */}
      <div className="bg-blue-600 text-white px-6 py-4">
        <h2 className="text-xl font-bold">🏛️ 소득세법 AI 상담</h2>
        <p className="text-sm text-blue-100 mt-1">
          소득세에 관한 질문을 해주세요. RAG 기반으로 답변해드립니다.
        </p>
      </div>

      {/* ===== 채팅 메시지 영역 ===== */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* 초기 안내 메시지 */}
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-lg mb-2">👋 안녕하세요!</p>
            <p className="text-sm">
              소득세에 관한 질문을 입력해주세요.
              <br />
              예: &quot;연봉 7천만원인 직장인의 소득세는 얼마인가요?&quot;
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
              {/* 역할 표시 */}
              <div
                className={`text-xs mb-1 ${
                  message.role === "user" ? "text-blue-100" : "text-gray-500"
                }`}
              >
                {message.role === "user" ? "나" : "AI 상담사"}
              </div>

              {/* 메시지 내용 */}
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
                <span className="text-gray-500 text-sm">답변 생성 중...</span>
              </div>
            </div>
          </div>
        )}

        {/* 스크롤 앵커 */}
        <div ref={messagesEndRef} />
      </div>

      {/* ===== 입력 영역 ===== */}
      <form onSubmit={handleSubmit} className="border-t border-gray-200 p-4 bg-white">
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

        {/* 힌트 텍스트 */}
        <p className="text-xs text-gray-400 mt-2">
          Enter 키를 누르거나 전송 버튼을 클릭하세요
        </p>
      </form>
    </div>
  );
}
