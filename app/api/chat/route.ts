// ================================
// API Route: /api/chat
// ================================
// 이 파일은 Next.js의 API Routes 기능을 사용한 백엔드 엔드포인트입니다.
// FE에서 POST 요청으로 질문을 보내면, RAG 파이프라인을 통해 답변을 생성합니다.
//
// [요청 형식]
// POST /api/chat
// Body: { "query": "사용자 질문" }
//
// [응답 형식]
// { "answer": "AI 답변", "sources": ["참고 문서 1", "참고 문서 2", ...] }
//
// [Python 비교]
// Python에서는 FastAPI나 Flask로 별도 서버를 구성해야 했지만,
// Next.js에서는 app/api 폴더 내 route.ts 파일 하나로 API를 만들 수 있습니다.

import { NextRequest, NextResponse } from "next/server";
import { askQuestion, initializeVectorStore } from "@/lib/rag";
import { ChatRequest, ChatResponse } from "@/types";

// ================================
// 서버 시작 시 벡터 스토어 초기화
// ================================
// 첫 번째 요청이 들어오기 전에 벡터 스토어를 미리 초기화합니다.
// 이렇게 하면 첫 질문에 대한 응답 시간이 단축됩니다.
let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    console.log("벡터 스토어 초기화 중...");
    await initializeVectorStore();
    initialized = true;
    console.log("벡터 스토어 초기화 완료!");
  }
}

// ================================
// POST 핸들러 - 질문 처리
// ================================
// FE에서 axios.post('/api/chat', { query: '질문' }) 형태로 호출합니다.

export async function POST(request: NextRequest) {
  try {
    // 1. 요청 바디에서 질문 추출
    const body: ChatRequest = await request.json();
    const { query } = body;

    // 2. 질문 유효성 검사
    if (!query || typeof query !== "string" || query.trim() === "") {
      return NextResponse.json(
        { error: "질문을 입력해주세요." },
        { status: 400 }
      );
    }

    console.log(`\n========== 새로운 질문 ==========`);
    console.log(`질문: ${query}`);

    // 3. 벡터 스토어 초기화 확인
    await ensureInitialized();

    // 4. RAG 파이프라인 실행
    // - 질문을 임베딩으로 변환
    // - 벡터 DB에서 유사 문서 검색
    // - 검색된 문서 + 질문으로 프롬프트 구성
    // - LLM으로 답변 생성
    const { answer, sources } = await askQuestion(query);

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

    // OpenAI API 키 관련 에러 처리
    if (error instanceof Error) {
      if (error.message.includes("API key")) {
        return NextResponse.json(
          { error: "OpenAI API 키가 설정되지 않았습니다. .env.local 파일을 확인해주세요." },
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
// GET 핸들러 - 상태 확인 (선택적)
// ================================
// API 상태를 확인하는 용도로 사용할 수 있습니다.

export async function GET() {
  return NextResponse.json({
    status: "ok",
    message: "소득세 RAG API가 정상 작동 중입니다.",
    initialized,
  });
}
