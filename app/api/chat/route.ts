// ================================
// API Route: /api/chat
// ================================
// POST 요청으로 질문을 보내면, RAG 파이프라인을 통해 답변을 생성합니다.
//
// [요청 형식]
// POST /api/chat
// Body: { "query": "사용자 질문", "modelType": "openai" | "upstage" | "openai-pinecone" | "upstage-pinecone" }
//
// [응답 형식]
// { "answer": "AI 답변", "sources": ["참고 문서 1", ...] }

import { NextRequest, NextResponse } from "next/server";
import { askQuestion } from "@/lib/rag";
import { ChatRequest, ChatResponse, ModelType } from "@/types";

// 유효한 모델 타입
const VALID_MODEL_TYPES: ModelType[] = [
  "openai",
  "upstage",
  "openai-pinecone",
  "upstage-pinecone",
];

// ================================
// POST 핸들러 - 질문 처리
// ================================

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디에서 질문 및 모델 타입 추출
    const body: ChatRequest = await request.json();
    const { query, modelType = "openai" } = body;

    // 2. 질문 유효성 검사
    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    // 3. 모델 타입 유효성 검사
    if (!VALID_MODEL_TYPES.includes(modelType)) {
      return NextResponse.json(
        { error: `지원하지 않는 모델 타입입니다. (${VALID_MODEL_TYPES.join(", ")})` },
        { status: 400 }
      );
    }

    console.log(`\n========== 새로운 질문 [${modelType}] ==========`);
    console.log(`질문: ${query}`);

    // 4. RAG 파이프라인 실행
    const { answer, sources } = await askQuestion(query, modelType);

    console.log(`답변 생성 완료: ${answer.substring(0, 100)}...`);

    // 5. 응답 반환
    const response: ChatResponse = {
      answer,
      sources,
    };

    return NextResponse.json(response);
  } catch (error) {
    // 에러 처리
    console.error("API 에러:", error);

    if (error instanceof Error) {
      // API 키 관련 에러
      if (error.message.includes("API key") || error.message.includes("OpenAI")) {
        return NextResponse.json(
          { error: "OpenAI API 키가 설정되지 않았습니다." },
          { status: 500 }
        );
      }
      if (error.message.includes("Upstage") || error.message.includes("UPSTAGE")) {
        return NextResponse.json(
          { error: "Upstage API 키가 설정되지 않았습니다." },
          { status: 500 }
        );
      }
      if (error.message.includes("Pinecone") || error.message.includes("PINECONE")) {
        return NextResponse.json(
          { error: "Pinecone API 키 또는 인덱스 설정을 확인해주세요." },
          { status: 500 }
        );
      }
    }

    return NextResponse.json(
      { error: "답변 생성 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// ================================
// GET 핸들러 - 상태 확인
// ================================

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "소득세 RAG API가 정상 작동 중입니다.",
    supportedModels: VALID_MODEL_TYPES,
  });
}
