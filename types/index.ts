// ================================
// 타입 정의
// ================================

/**
 * 임베딩 모델 타입
 * - openai: OpenAI text-embedding-3-large
 * - upstage: Upstage solar-embedding-1-large
 */
export type EmbeddingType = "openai" | "upstage";

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
 * - embeddingType: 사용할 임베딩 모델
 */
export interface ChatRequest {
  query: string;
  embeddingType: EmbeddingType;
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
