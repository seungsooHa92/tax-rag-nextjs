// ================================
// 타입 정의
// ================================

/**
 * 채팅 메시지 타입
 * - user: 사용자가 보낸 메시지
 * - assistant: AI가 생성한 답변
 */
export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

/**
 * API 요청 타입 (FE → BE)
 * - query: 사용자의 질문
 */
export interface ChatRequest {
  query: string;
}

/**
 * API 응답 타입 (BE → FE)
 * - answer: AI가 생성한 답변
 * - sources: 참고한 문서 조각들 (선택적)
 */
export interface ChatResponse {
  answer: string;
  sources?: string[];
}
