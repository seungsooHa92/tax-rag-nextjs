// ================================
// RAG (Retrieval-Augmented Generation) 핵심 로직
// ================================
//
// [지원 모델 조합]
// 1. openai: OpenAI Embedding + Memory VectorStore + GPT-4o-mini
// 2. upstage: Upstage Embedding + Memory VectorStore + Solar-pro2
// 3. openai-pinecone: OpenAI Embedding + Pinecone + GPT-4o-mini
// 4. upstage-pinecone: Upstage Embedding + Pinecone + Solar-pro2
//
// [벡터스토어 관리]
// - Memory: 각 임베딩 모델별로 별도의 VectorStore를 메모리에 유지
// - Pinecone: 외부 벡터 DB 사용 (사전 인덱싱 필요)

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import fs from "fs";
import path from "path";
import { ModelType } from "@/types";

// ================================
// Upstage 커스텀 임베딩 클래스
// ================================
// LangChain의 OpenAIEmbeddings가 Upstage API와 호환되지 않아
// 직접 API를 호출하는 커스텀 클래스 사용

class UpstageEmbeddings extends Embeddings {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = "embedding-query") {
    super({});
    this.apiKey = apiKey;
    this.model = model;
  }

  async embedDocuments(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    for (const text of texts) {
      const embedding = await this.embedQuery(text);
      embeddings.push(embedding);
    }
    return embeddings;
  }

  async embedQuery(text: string): Promise<number[]> {
    const response = await fetch("https://api.upstage.ai/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.model,
        input: text,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Upstage API 오류: ${response.status} - ${error}`);
    }

    const data = await response.json();
    return data.data[0].embedding;
  }
}

// ================================
// 타입 정의
// ================================

type EmbeddingProvider = "openai" | "upstage";
type VectorStoreType = "memory" | "pinecone";

// ModelType에서 임베딩 제공자와 벡터스토어 타입 추출
function parseModelType(modelType: ModelType): {
  embedding: EmbeddingProvider;
  vectorStore: VectorStoreType;
} {
  if (modelType.includes("pinecone")) {
    const embedding = modelType.replace("-pinecone", "") as EmbeddingProvider;
    return { embedding, vectorStore: "pinecone" };
  }
  return { embedding: modelType as EmbeddingProvider, vectorStore: "memory" };
}

// ================================
// 전역 변수 (서버 메모리에 유지)
// ================================

// Memory VectorStore (임베딩별로 관리)
const memoryStores: Record<EmbeddingProvider, MemoryVectorStore | null> = {
  openai: null,
  upstage: null,
};

const isMemoryInitialized: Record<EmbeddingProvider, boolean> = {
  openai: false,
  upstage: false,
};

// Pinecone 클라이언트 (싱글톤)
let pineconeClient: Pinecone | null = null;

function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

// ================================
// 임베딩 모델 인스턴스 생성
// ================================

function getEmbeddings(provider: EmbeddingProvider): Embeddings {
  switch (provider) {
    case "openai":
      return new OpenAIEmbeddings({
        model: "text-embedding-3-large",
      });
    case "upstage":
      // 커스텀 클래스 사용 (OpenAIEmbeddings 호환성 문제)
      return new UpstageEmbeddings(
        process.env.UPSTAGE_API_KEY!,
        "embedding-query"
      );
    default:
      throw new Error(`지원하지 않는 임베딩 제공자: ${provider}`);
  }
}

// ================================
// LLM 인스턴스 생성
// ================================

function getLLM(provider: EmbeddingProvider): ChatOpenAI {
  switch (provider) {
    case "openai":
      return new ChatOpenAI({
        model: "gpt-4o-mini",
        temperature: 0,
      });
    case "upstage":
      return new ChatOpenAI({
        openAIApiKey: process.env.UPSTAGE_API_KEY,
        configuration: {
          baseURL: "https://api.upstage.ai/v1",
        },
        model: "solar-pro2",
        temperature: 0,
      });
    default:
      throw new Error(`지원하지 않는 LLM 제공자: ${provider}`);
  }
}

// ================================
// Memory VectorStore 초기화
// ================================

async function initializeMemoryStore(
  provider: EmbeddingProvider
): Promise<MemoryVectorStore> {
  if (isMemoryInitialized[provider] && memoryStores[provider]) {
    console.log(`[${provider}] Memory 벡터 스토어가 이미 초기화되어 있습니다.`);
    return memoryStores[provider]!;
  }

  console.log(`[${provider}] Memory 벡터 스토어 초기화 시작...`);

  // 1. 문서 로드
  const taxFilePath = path.join(process.cwd(), "data", "tax.txt");
  const taxContent = fs.readFileSync(taxFilePath, "utf-8");
  console.log(`[${provider}] 문서 로드 완료: ${taxContent.length} 글자`);

  // 2. 텍스트 분할
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });
  const docs = await textSplitter.createDocuments([taxContent]);
  console.log(`[${provider}] 문서 분할 완료: ${docs.length}개의 청크 생성`);

  // 3. 임베딩 생성 및 저장
  const embeddings = getEmbeddings(provider);
  memoryStores[provider] = await MemoryVectorStore.fromDocuments(
    docs,
    embeddings
  );

  isMemoryInitialized[provider] = true;
  console.log(`[${provider}] Memory 벡터 스토어 초기화 완료!`);

  return memoryStores[provider]!;
}

// ================================
// Pinecone VectorStore 가져오기
// ================================

async function getPineconeStore(
  provider: EmbeddingProvider
): Promise<PineconeStore> {
  console.log(`[${provider}-pinecone] Pinecone 벡터 스토어 연결 중...`);

  const pc = getPineconeClient();
  const indexName =
    provider === "openai"
      ? process.env.PINECONE_INDEX_OPENAI!
      : process.env.PINECONE_INDEX_UPSTAGE!;

  const index = pc.index(indexName);
  const embeddings = getEmbeddings(provider);

  const store = await PineconeStore.fromExistingIndex(embeddings, {
    pineconeIndex: index,
  });

  console.log(`[${provider}-pinecone] Pinecone 연결 완료! (index: ${indexName})`);
  return store;
}

// ================================
// VectorStore 가져오기 (통합)
// ================================

async function getVectorStore(
  modelType: ModelType
): Promise<MemoryVectorStore | PineconeStore> {
  const { embedding, vectorStore } = parseModelType(modelType);

  if (vectorStore === "pinecone") {
    return getPineconeStore(embedding);
  }
  return initializeMemoryStore(embedding);
}

// ================================
// RAG 기반 질문 응답 함수
// ================================

export async function askQuestion(
  query: string,
  modelType: ModelType
): Promise<{
  answer: string;
  sources: string[];
}> {
  const { embedding } = parseModelType(modelType);

  // 1. 벡터 스토어 가져오기
  const vectorStore = await getVectorStore(modelType);

  // 2. 유사도 검색 (Retrieval)
  const retrievedDocs = await vectorStore.similaritySearch(query, 3);
  console.log(`[${modelType}] 검색된 문서: ${retrievedDocs.length}개`);

  // 검색된 문서 내용 추출
  const context = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");

  // 3. 프롬프트 구성 (Augmentation)
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

  // 4. LLM 호출 및 답변 생성 (Generation)
  const llm = getLLM(embedding);
  const response = await llm.invoke(prompt);

  // 응답에서 텍스트 추출
  const answer =
    typeof response.content === "string"
      ? response.content
      : JSON.stringify(response.content);

  // 참고 문서 목록
  const sources = retrievedDocs.map(
    (doc) => doc.pageContent.substring(0, 100) + "..."
  );

  return { answer, sources };
}

// ================================
// 타입 내보내기
// ================================
export type { Document };
