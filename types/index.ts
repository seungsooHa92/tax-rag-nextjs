// ================================
// 타입 정의
// ================================

/**
 * 모델 타입 (임베딩 + 벡터스토어 조합)
 * - openai: OpenAI + Memory
 * - upstage: Upstage + Memory
 * - openai-pinecone: OpenAI + Pinecone
 * - upstage-pinecone: Upstage + Pinecone
 */
export type ModelType =
  | "openai"
  | "upstage"
  | "openai-pinecone"
  | "upstage-pinecone";

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
 * - modelType: 사용할 모델 조합
 */
export interface ChatRequest {
  query: string;
  modelType: ModelType;
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
