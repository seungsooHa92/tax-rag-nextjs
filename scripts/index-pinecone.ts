// ================================
// Pinecone 인덱싱 스크립트
// ================================
// tax.txt 파일을 읽어서 Pinecone에 임베딩 데이터를 저장합니다.
//
// 사용법:
//   npm run index:pinecone -- --provider openai
//   npm run index:pinecone -- --provider upstage
//   npm run index:pinecone -- --provider all

import { Pinecone } from "@pinecone-database/pinecone";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PineconeStore } from "@langchain/pinecone";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents";
import { Embeddings } from "@langchain/core/embeddings";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

// 환경변수 로드
dotenv.config({ path: ".env.local" });

// ================================
// 타입 정의
// ================================

type Provider = "openai" | "upstage";

// ================================
// Upstage 커스텀 임베딩 클래스
// ================================

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
        "Authorization": `Bearer ${this.apiKey}`,
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
// 설정
// ================================

interface IndexConfig {
  provider: Provider;
  indexName: string;
  embedding: Embeddings;
}

function getIndexConfig(provider: Provider): IndexConfig {
  switch (provider) {
    case "openai":
      return {
        provider: "openai",
        indexName: process.env.PINECONE_INDEX_OPENAI!,
        embedding: new OpenAIEmbeddings({
          model: "text-embedding-3-large",
        }),
      };
    case "upstage":
      return {
        provider: "upstage",
        indexName: process.env.PINECONE_INDEX_UPSTAGE!,
        embedding: new UpstageEmbeddings(
          process.env.UPSTAGE_API_KEY!,
          "embedding-query"
        ),
      };
    default:
      throw new Error(`지원하지 않는 provider: ${provider}`);
  }
}

// ================================
// 메인 인덱싱 함수
// ================================

async function indexToPinecone(provider: Provider): Promise<void> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`[${provider}] Pinecone 인덱싱 시작`);
  console.log(`${"=".repeat(50)}\n`);

  // 1. 설정 가져오기
  const config = getIndexConfig(provider);

  if (!config.indexName) {
    throw new Error(
      `PINECONE_INDEX_${provider.toUpperCase()} 환경변수가 설정되지 않았습니다.`
    );
  }

  console.log(`[${provider}] 인덱스: ${config.indexName}`);

  // 2. 문서 로드
  const taxFilePath = path.join(process.cwd(), "data", "tax.txt");

  if (!fs.existsSync(taxFilePath)) {
    throw new Error(`파일을 찾을 수 없습니다: ${taxFilePath}`);
  }

  const taxContent = fs.readFileSync(taxFilePath, "utf-8");
  console.log(`[${provider}] 문서 로드 완료: ${taxContent.length} 글자`);

  // 3. 텍스트 분할
  const textSplitter = new RecursiveCharacterTextSplitter({
    chunkSize: 1500,
    chunkOverlap: 200,
  });

  const docs = await textSplitter.createDocuments([taxContent]);
  console.log(`[${provider}] 문서 분할 완료: ${docs.length}개의 청크 생성`);

  // 4. Pinecone 클라이언트 생성
  const pc = new Pinecone({
    apiKey: process.env.PINECONE_API_KEY!,
  });

  const index = pc.index(config.indexName);

  // 5. 기존 데이터 삭제 (선택적)
  console.log(`[${provider}] 기존 데이터 삭제 중...`);
  try {
    await index.deleteAll();
    console.log(`[${provider}] 기존 데이터 삭제 완료`);
  } catch (error) {
    console.log(`[${provider}] 기존 데이터 없음 또는 삭제 스킵`);
  }

  // 6. 임베딩 생성 및 Pinecone에 저장
  console.log(`[${provider}] 임베딩 생성 및 저장 중... (시간이 걸릴 수 있습니다)`);

  // 첫 번째 문서로 테스트
  console.log(`[${provider}] 첫 번째 문서 임베딩 테스트 중...`);
  const testEmbedding = await config.embedding.embedQuery(docs[0].pageContent);
  console.log(`[${provider}] 임베딩 차원: ${testEmbedding.length}`);
  console.log(`[${provider}] 임베딩 샘플: [${testEmbedding.slice(0, 3).join(", ")}...]`);

  await PineconeStore.fromDocuments(docs, config.embedding, {
    pineconeIndex: index,
  });

  console.log(`\n[${provider}] 인덱싱 완료!`);
  console.log(`[${provider}] ${docs.length}개의 문서가 Pinecone에 저장되었습니다.`);
}

// ================================
// CLI 실행
// ================================

async function main() {
  // 인자 파싱
  const args = process.argv.slice(2);
  let provider: Provider | "all" = "all";

  const providerIndex = args.indexOf("--provider");
  if (providerIndex !== -1 && args[providerIndex + 1]) {
    provider = args[providerIndex + 1] as Provider | "all";
  }

  // 환경변수 체크
  if (!process.env.PINECONE_API_KEY) {
    console.error("오류: PINECONE_API_KEY가 설정되지 않았습니다.");
    process.exit(1);
  }

  console.log("\n========================================");
  console.log("  Pinecone 인덱싱 스크립트");
  console.log("========================================\n");

  try {
    if (provider === "all") {
      // 모든 provider 인덱싱
      console.log("모든 provider를 인덱싱합니다...\n");

      if (process.env.OPENAI_API_KEY && process.env.PINECONE_INDEX_OPENAI) {
        await indexToPinecone("openai");
      } else {
        console.log("[openai] 스킵 - API 키 또는 인덱스 미설정");
      }

      if (process.env.UPSTAGE_API_KEY && process.env.PINECONE_INDEX_UPSTAGE) {
        await indexToPinecone("upstage");
      } else {
        console.log("[upstage] 스킵 - API 키 또는 인덱스 미설정");
      }
    } else {
      // 특정 provider만 인덱싱
      await indexToPinecone(provider);
    }

    console.log("\n========================================");
    console.log("  인덱싱 완료!");
    console.log("========================================\n");
  } catch (error) {
    console.error("\n인덱싱 실패:", error);
    process.exit(1);
  }
}

main();
