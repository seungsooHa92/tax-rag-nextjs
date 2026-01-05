# 소득세법 AI 상담 (RAG 기반)

> Python LangChain + Chroma 프로젝트를 Next.js + TypeScript로 마이그레이션한 프로젝트입니다.

## 📚 프로젝트 개요

이 프로젝트는 **RAG (Retrieval-Augmented Generation)** 기술을 사용하여 소득세법에 관한 질문에 답변하는 AI 챗봇입니다.

### Python → Next.js 마이그레이션 비교

| Python (원본) | Next.js (마이그레이션) |
|:---|:---|
| Docx2txtLoader | 텍스트 파일 직접 로드 |
| RecursiveCharacterTextSplitter | RecursiveCharacterTextSplitter (LangChain.js) |
| OpenAIEmbeddings | OpenAIEmbeddings (@langchain/openai) |
| Chroma | MemoryVectorStore (서버리스 호환) |
| ChatOpenAI | ChatOpenAI (@langchain/openai) |
| FastAPI/Flask | Next.js API Routes |

## 🏗️ 프로젝트 구조

```
tax-rag-nextjs/
├── app/                      # Next.js App Router
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # BE: RAG API 엔드포인트
│   ├── globals.css           # 전역 스타일
│   ├── layout.tsx            # 루트 레이아웃
│   ├── page.tsx              # 메인 페이지
│   └── providers.tsx         # TanStack Query Provider
│
├── components/
│   └── ChatInterface.tsx     # FE: 채팅 UI 컴포넌트
│
├── lib/
│   └── rag.ts                # RAG 핵심 로직 (임베딩, 검색, 생성)
│
├── data/
│   └── tax.txt               # 소득세법 문서 (원본: tax.docx)
│
├── types/
│   └── index.ts              # TypeScript 타입 정의
│
├── .env.example              # 환경변수 예시
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── README.md
```

## 🚀 시작하기

### 1. 의존성 설치

```bash
yarn install
```

### 2. 환경변수 설정

`.env.example`을 복사하여 `.env.local` 파일을 만들고 OpenAI API 키를 입력하세요:

```bash
cp .env.example .env.local
```

```env
# .env.local
OPENAI_API_KEY=sk-your-api-key-here
```

> ⚠️ OpenAI API 키는 [platform.openai.com](https://platform.openai.com/api-keys)에서 발급받으세요.  
> ChatGPT Plus 구독과 API 크레딧은 별개입니다!

### 3. 개발 서버 실행

```bash
yarn dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

## 📖 RAG 흐름 이해하기

### Phase 1: 인덱싱 (서버 시작 시 1회)

```
소득세법 문서 (tax.txt)
       ↓
청킹 (1500자 단위, 200자 중첩)
       ↓
임베딩 (text-embedding-3-large)
       ↓
MemoryVectorStore에 저장
```

### Phase 2: 질문 처리 (매 요청마다)

```
사용자 질문
       ↓
질문 임베딩
       ↓
유사도 검색 (Top 3)
       ↓
프롬프트 조합 (질문 + 검색 결과)
       ↓
LLM 답변 생성 (gpt-4o-mini)
       ↓
사용자에게 답변 전달
```

## 🛠️ 기술 스택

### Frontend
- **Next.js 14** - React 프레임워크
- **TypeScript** - 타입 안전성
- **Tailwind CSS** - 스타일링
- **TanStack Query** - 서버 상태 관리
- **Axios** - HTTP 클라이언트

### Backend (Next.js API Routes)
- **LangChain.js** - LLM 애플리케이션 프레임워크
- **@langchain/openai** - OpenAI 연동
- **MemoryVectorStore** - 벡터 저장소 (서버리스 호환)

## 📝 주요 파일 설명

### `lib/rag.ts` - RAG 핵심 로직

```typescript
// Python 코드와의 비교
// Python: database = Chroma.from_documents(documents=docs_list, embedding=embeddings)
// Next.js: vectorStore = await MemoryVectorStore.fromDocuments(docs, embeddings)

// Python: retrieved_docs = database.similarity_search(query, 3)
// Next.js: const retrievedDocs = await vectorStore.similaritySearch(query, 3)
```

### `app/api/chat/route.ts` - API 엔드포인트

```typescript
// Next.js API Routes는 파일 기반 라우팅
// app/api/chat/route.ts → POST /api/chat

export async function POST(request: NextRequest) {
  const { query } = await request.json();
  const { answer, sources } = await askQuestion(query);
  return NextResponse.json({ answer, sources });
}
```

### `components/ChatInterface.tsx` - 채팅 UI

```typescript
// TanStack Query의 useMutation 사용
const mutation = useMutation({
  mutationFn: sendMessage,
  onSuccess: (data) => {
    // 응답을 채팅 히스토리에 추가
  },
});
```

## 🌐 Vercel 배포

### 1. GitHub에 푸시

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Vercel에서 배포

1. [vercel.com](https://vercel.com)에서 프로젝트 import
2. 환경변수 설정: `OPENAI_API_KEY`
3. Deploy!

> ⚠️ 주의: 첫 요청 시 벡터 스토어 초기화로 인해 응답이 느릴 수 있습니다.

## 💡 확장 아이디어

- [ ] 스트리밍 응답 (실시간 타이핑 효과)
- [ ] 대화 히스토리 저장 (로컬 스토리지)
- [ ] 다른 벡터 DB 연동 (Pinecone, Supabase)
- [ ] 여러 문서 지원
- [ ] 인용 표시 (답변에 참고 문서 표시)

## 📚 학습 자료

- [LangChain.js 공식 문서](https://js.langchain.com)
- [Next.js 공식 문서](https://nextjs.org/docs)
- [TanStack Query 공식 문서](https://tanstack.com/query)
- [Vercel AI SDK](https://sdk.vercel.ai) - 더 간단한 AI 앱 개발

## 🤝 기여

이 프로젝트는 학습 목적으로 만들어졌습니다. 개선 사항이 있다면 PR을 보내주세요!

## 📄 라이선스

MIT License
