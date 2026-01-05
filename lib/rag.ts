// ================================
// RAG (Retrieval-Augmented Generation) 핵심 로직
// ================================
// 이 파일은 Python으로 작성된 RAG 로직을 Next.js/TypeScript로 마이그레이션한 것입니다.
//
// [Python 원본 흐름]
// 1. Docx2txtLoader로 문서 로드
// 2. RecursiveCharacterTextSplitter로 청킹
// 3. OpenAIEmbeddings로 임베딩
// 4. Chroma에 저장
// 5. similarity_search로 검색
// 6. ChatOpenAI로 답변 생성
//
// [Next.js 버전 흐름]
// 1. 텍스트 파일에서 문서 로드
// 2. RecursiveCharacterTextSplitter로 청킹
// 3. OpenAIEmbeddings로 임베딩
// 4. MemoryVectorStore에 저장 (서버리스 환경 호환)
// 5. similaritySearch로 검색
// 6. ChatOpenAI로 답변 생성

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import fs from "fs";
import path from "path";

// ================================
// 전역 변수 (서버 메모리에 유지)
// ================================
// 서버가 시작되면 벡터 스토어를 한 번만 초기화하고 메모리에 유지합니다.
// Python의 Chroma persist_directory와 달리, 서버리스 환경에서는
// 메모리 기반 벡터 스토어를 사용합니다.

let vectorStore: MemoryVectorStore | null = null;
let isInitialized = false;

// ================================
// LLM 및 임베딩 모델 설정
// ================================
// Python 코드와 동일한 모델 사용:
// - 임베딩: text-embedding-3-large
// - LLM: gpt-4o-mini

const embeddings = new OpenAIEmbeddings({
  model: "text-embedding-3-large", // Python: OpenAIEmbeddings(model="text-embedding-3-large")
});

const llm = new ChatOpenAI({
  model: "gpt-4o-mini", // Python: ChatOpenAI(model="gpt-4o-mini")
  temperature: 0, // 일관된 답변을 위해 temperature를 0으로 설정
});

// ================================
// 벡터 스토어 초기화 함수
// ================================
// Python 코드의 다음 부분에 해당:
// loader = Docx2txtLoader("./tax.docx")
// docs_list = loader.load_and_split(text_splitter=text_splitter)
// database = Chroma.from_documents(documents=docs_list, embedding=embeddings, ...)

export async function initializeVectorStore(): Promise<void> {
  // 이미 초기화되었으면 스킵
  if (isInitialized && vectorStore) {
    console.log("벡터 스토어가 이미 초기화되어 있습니다.");
    return;
  }

  console.log("벡터 스토어 초기화 시작...");

  // 1. 문서 로드 (Python의 Docx2txtLoader 대신 텍스트 파일 직접 읽기)
  const taxFilePath = path.join(process.cwd(), "data", "tax.txt");
  const taxContent = fs.readFileSync(taxFilePath, "utf-8");

  console.log(`문서 로드 완료: ${taxContent.length} 글자`);

  // 2. 텍스트 분할 (청킹)
  // Python: RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500, // 각 청크의 최대 크기
    chunkOverlap: 200, // 청크 간 겹치는 부분 (맥락 유지를 위해)
  });

  // 문서를 청크로 분할
  const docs = await textSplitter.createDocuments([taxContent]);
  console.log(`문서 분할 완료: ${docs.length}개의 청크 생성`);

  // 3. 임베딩 생성 및 벡터 스토어에 저장
  // Python: Chroma.from_documents(documents=docs_list, embedding=embeddings, ...)
  // Next.js: MemoryVectorStore 사용 (서버리스 환경 호환)
  vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings);

  isInitialized = true;
  console.log("벡터 스토어 초기화 완료!");
}

// ================================
// RAG 기반 질문 응답 함수
// ================================
// Python 코드의 다음 부분에 해당:
// retrieved_docs = database.similarity_search(query, 3)
// prompt = f"""..."""
// ai_message = llm.invoke(prompt)

export async function askQuestion(query: string): Promise<{
  answer: string;
  sources: string[];
}> {
  // 벡터 스토어가 초기화되지 않았으면 초기화
  if (!vectorStore) {
    await initializeVectorStore();
  }

  // 1. 유사도 검색 (Retrieval)
  // Python: database.similarity_search(query, 3)
  // 질문과 가장 유사한 문서 3개를 검색
  const retrievedDocs = await vectorStore!.similaritySearch(query, 3);

  console.log(`검색된 문서: ${retrievedDocs.length}개`);

  // 검색된 문서 내용 추출
  const context = retrievedDocs.map((doc) => doc.pageContent).join("\n\n");

  // 2. 프롬프트 구성 (Augmentation)
  // Python 프롬프트와 동일한 구조:
  // [Identity] - AI의 역할 정의
  // [Context] - 검색된 문서 내용
  // [Question] - 사용자 질문
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
  // Python: ai_message = llm.invoke(prompt)
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
