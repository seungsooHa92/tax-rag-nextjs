"use client";

// ================================
// Sidebar 컴포넌트
// ================================
// 모델 조합을 선택할 수 있는 사이드바 UI
// - OpenAI (Memory)
// - Upstage (Memory)
// - OpenAI + Pinecone
// - Upstage + Pinecone

import { ModelType } from "@/types";

// ================================
// 모델 설정 정보
// ================================

const MODEL_CONFIG: Record<
  ModelType,
  {
    name: string;
    description: string;
    embedding: string;
    llm: string;
    vectorStore: string;
    provider: string;
  }
> = {
  openai: {
    name: "OpenAI",
    description: "범용 다국어 모델",
    embedding: "text-embedding-3-large",
    llm: "gpt-4o-mini",
    vectorStore: "Memory",
    provider: "OpenAI",
  },
  upstage: {
    name: "Upstage",
    description: "한국어 최적화 모델",
    embedding: "solar-embedding-1-large",
    llm: "solar-pro2",
    vectorStore: "Memory",
    provider: "Upstage AI",
  },
  "openai-pinecone": {
    name: "OpenAI + Pinecone",
    description: "범용 모델 + 벡터 DB",
    embedding: "text-embedding-3-large",
    llm: "gpt-4o-mini",
    vectorStore: "Pinecone",
    provider: "OpenAI",
  },
  "upstage-pinecone": {
    name: "Upstage + Pinecone",
    description: "한국어 모델 + 벡터 DB",
    embedding: "solar-embedding-1-large",
    llm: "solar-pro2",
    vectorStore: "Pinecone",
    provider: "Upstage AI",
  },
};

// ================================
// Props 타입 정의
// ================================

interface SidebarProps {
  selectedModel: ModelType;
  onSelect: (type: ModelType) => void;
  disabled?: boolean;
}

// ================================
// Sidebar 컴포넌트
// ================================

export default function Sidebar({
  selectedModel,
  onSelect,
  disabled = false,
}: SidebarProps) {
  const selectedConfig = MODEL_CONFIG[selectedModel];

  return (
    <aside className="w-72 bg-gray-900 text-white flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">AI 모델</h2>
        <p className="text-xs text-gray-400 mt-1">
          RAG에 사용할 모델 조합 선택
        </p>
      </div>

      {/* 모델 선택 */}
      <div className="p-4 space-y-2 flex-1 overflow-y-auto">
        {(Object.keys(MODEL_CONFIG) as ModelType[]).map((type) => {
          const config = MODEL_CONFIG[type];
          const isSelected = selectedModel === type;
          const isPinecone = type.includes("pinecone");

          return (
            <label
              key={type}
              className={`
                flex items-start p-3 rounded-lg cursor-pointer transition-colors
                ${isSelected
                  ? "bg-blue-600 ring-2 ring-blue-400"
                  : "bg-gray-800 hover:bg-gray-700"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <input
                type="radio"
                name="model"
                value={type}
                checked={isSelected}
                onChange={() => onSelect(type)}
                disabled={disabled}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{config.name}</span>
                  {isPinecone && (
                    <span className="px-1.5 py-0.5 bg-green-600 text-[10px] rounded">
                      Vector DB
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {config.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* 선택된 모델 정보 */}
      <div className="p-4 border-t border-gray-700 bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-300 mb-2">모델 정보</h3>
        <dl className="space-y-2 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-500">Provider</dt>
            <dd className="text-gray-300">{selectedConfig.provider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Embedding</dt>
            <dd className="text-gray-300 font-mono text-[10px]">
              {selectedConfig.embedding}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">LLM</dt>
            <dd className="text-gray-300 font-mono text-[10px]">
              {selectedConfig.llm}
            </dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">VectorStore</dt>
            <dd className={`font-mono text-[10px] ${
              selectedConfig.vectorStore === "Pinecone"
                ? "text-green-400"
                : "text-gray-300"
            }`}>
              {selectedConfig.vectorStore}
            </dd>
          </div>
        </dl>
      </div>

    </aside>
  );
}
