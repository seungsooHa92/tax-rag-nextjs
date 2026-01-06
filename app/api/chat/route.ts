// ================================
// API Route: /api/chat
// ================================
// 이 파일은 Next.js의 API Routes 기능을 사용한 백엔드 엔드포인트입니다.
// FE에서 POST 요청으로 질문을 보내면, RAG 파이프라인을 통해 답변을 생성합니다.
//
// [요청 형식]
// POST /api/chat
// Body: { "query": "사용자 질문", "embeddingType": "openai" | "upstage" }
//
// [응답 형식]
// { "answer": "AI 답변", "sources": ["참고 문서 1", "참고 문서 2", ...] }

import { NextRequest, NextResponse } from "next/server";
import { askQuestion, initializeVectorStore, isVectorStoreInitialized } from "@/lib/rag";
import { ChatRequest, ChatResponse, EmbeddingType } from "@/types";

// ================================
// 벡터 스토어 초기화 관리
// ================================

async function ensureInitialized(embeddingType: EmbeddingType) {
  if (!isVectorStoreInitialized(embeddingType)) {
    console.log(`[${embeddingType}] 벡터 스토어 초기화 중...`);
    await initializeVectorStore(embeddingType);
    console.log(`[${embeddingType}] 벡터 스토어 초기화 완료!`);
  }
}

// ================================
// POST 핸들러 - 질문 처리
// ================================

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디에서 질문 및 임베딩 타입 추출
    const body: ChatRequest = await request.json();
    const { query, embeddingType = "openai" } = body;

    // 2. 질문 유효성 검사
    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    // 3. 임베딩 타입 유효성 검사
    if (embeddingType !== "openai" && embeddingType !== "upstage") {
      return NextResponse.json(
        { error: "지원하지 않는 임베딩 타입입니다. (openai 또는 upstage)" },
        { status: 400 }
      );
    }

    console.log(`\n========== 새로운 질문 [${embeddingType}] ==========`);
    console.log(`질문: ${query}`);

    // 4. 벡터 스토어 초기화 확인
    await ensureInitialized(embeddingType);

    // 5. RAG 파이프라인 실행
    const { answer, sources } = await askQuestion(query, embeddingType);

    console.log(`답변 생성 완료: ${answer.substring(0, 100)}...`);

    // 6. 응답 반환
    const response: ChatResponse = {
      answer,
      sources,
    };

    return NextResponse.json(response);
  } catch (error) {
    // 에러 처리
    console.error("API 에러:", error);

    if (error instanceof Error) {
      // OpenAI API 키 관련 에러
      if (error.message.includes("API key") || error.message.includes("OpenAI")) {
        return NextResponse.json(
          { error: "OpenAI API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
          { status: 500 }
        );
      }
      // Upstage API 키 관련 에러
      if (error.message.includes("Upstage") || error.message.includes("UPSTAGE")) {
        return NextResponse.json(
          { error: "Upstage API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
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
    initialized: {
      openai: isVectorStoreInitialized("openai"),
      upstage: isVectorStoreInitialized("upstage"),
    },
  });
}
