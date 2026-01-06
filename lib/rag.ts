// ================================
// RAG (Retrieval-Augmented Generation) 핵심 로직
// ================================
// 이 파일은 Python으로 작성된 RAG 로직을 Next.js/TypeScript로 마이그레이션한 것입니다.
//
// [지원 임베딩 모델]
// 1. OpenAI: text-embedding-3-large
// 2. Upstage: solar-embedding-1-large (query/passage 분리)
//
// [임베딩별 VectorStore 관리]
// - 각 임베딩 모델별로 별도의 VectorStore를 유지
// - 첫 요청 시 해당 임베딩의 VectorStore만 lazy 초기화

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";
import { EmbeddingType } from "@/types";

// ================================
// 전역 변수 (서버 메모리에 유지)
// ================================
// 임베딩 타입별로 별도의 VectorStore 관리

const vectorStores: Record<EmbeddingType, MemoryVectorStore | null> = {
  openai: null,
  upstage: null,
};

const isInitialized: Record<EmbeddingType, boolean> = {
  openai: false,
  upstage: false,
};

// ================================
// 임베딩 모델 인스턴스 생성
// ================================

function getEmbeddings(type: EmbeddingType): OpenAIEmbeddings {
  switch (type) {
    case "openai":
      return new OpenAIEmbeddings({
        model: "text-embedding-3-large",
      });
    case "upstage":
      // Upstage API는 OpenAI SDK와 호환 - baseURL만 변경
      // batchSize: 1 - Upstage는 input에 단일 문자열만 허용
      return new OpenAIEmbeddings({
        openAIApiKey: process.env.UPSTAGE_API_KEY,
        configuration: {
          baseURL: "https://api.upstage.ai/v1",
        },
        model: "embedding-query",
        batchSize: 1,
      });
    default:
      throw new Error(`지원하지 않는 임베딩 타입: ${type}`);
  }
}

// ================================
// LLM 설정
// ================================
// 답변 생성에는 동일한 LLM 사용 (gpt-4o-mini)

const llm = new ChatOpenAI({
  model: "gpt-4o-mini",
  temperature: 0,
});

// ================================
// 벡터 스토어 초기화 함수
// ================================

export async function initializeVectorStore(type: EmbeddingType): Promise<void> {
  // 이미 초기화되었으면 스킵
  if (isInitialized[type] && vectorStores[type]) {
    console.log(`[${type}] 벡터 스토어가 이미 초기화되어 있습니다.`);
    return;
  }

  console.log(`[${type}] 벡터 스토어 초기화 시작...`);

  // 1. 문서 로드
  const taxFilePath = path.join(process.cwd(), "data", "tax.txt");
  const taxContent = fs.readFileSync(taxFilePath, "utf-8");

  console.log(`[${type}] 문서 로드 완료: ${taxContent.length} 글자`);

  // 2. 텍스트 분할 (청킹)
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([taxContent]);
  console.log(`[${type}] 문서 분할 완료: ${docs.length}개의 청크 생성`);

  // 3. 임베딩 생성 및 벡터 스토어에 저장
  const embeddings = getEmbeddings(type);
  vectorStores[type] = await MemoryVectorStore.fromDocuments(docs, embeddings);

  isInitialized[type] = true;
  console.log(`[${type}] 벡터 스토어 초기화 완료!`);
}

// ================================
// 초기화 상태 확인 함수
// ================================

export function isVectorStoreInitialized(type: EmbeddingType): boolean {
  return isInitialized[type];
}

// ================================
// RAG 기반 질문 응답 함수
// ================================

export async function askQuestion(
  query: string,
  embeddingType: EmbeddingType
): Promise<{
  answer: string;
  sources: string[];
}> {
  // 벡터 스토어가 초기화되지 않았으면 초기화
  if (!vectorStores[embeddingType]) {
    await initializeVectorStore(embeddingType);
  }

  const vectorStore = vectorStores[embeddingType]!;

  // 1. 유사도 검색 (Retrieval)
  // Upstage의 경우 embedQuery()가 자동으로 query 모델 사용
  const retrievedDocs = await vectorStore.similaritySearch(query, 3);

  console.log(`[${embeddingType}] 검색된 문서: ${retrievedDocs.length}개`);

  // 검색된 문서 내용 추출
  const context = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");

  // 2. 프롬프트 구성 (Augmentation)
  const prompt = `
[Identity]
당신은 한국 최고의 소득세 전문가입니다.
[Context]를 참고하여 사용자의 질문에 친절하고 정확하게 답변해주세요.
답변은 한국어로 해주세요.

[Context]
${context}

[Question]
${query}
`;

  // 3. LLM 호출 및 답변 생성 (Generation)
  const response = await llm.invoke(prompt);

  // 응답에서 텍스트 추출
  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  // 참고 문서 목록 (소스 표시용)
  const sources = retrievedDocs.map(
    (doc) => doc.pageContent.substring(0, 100) + "..."
  );

  return { answer, sources };
}

// ================================
// 타입 내보내기
// ================================
export type { Document };
