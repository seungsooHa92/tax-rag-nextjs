"use client";

// ================================
// Sidebar 컴포넌트
// ================================
// 임베딩 모델을 선택할 수 있는 사이드바 UI
// 라디오 버튼으로 OpenAI / Upstage 선택

import { EmbeddingType } from "@/types";

// ================================
// 임베딩 모델 정보
// ================================

const EMBEDDING_MODELS: Record<
  EmbeddingType,
  {
    name: string;
    description: string;
    model: string;
    provider: string;
  }
> = {
  openai: {
    name: "OpenAI",
    description: "범용 다국어 임베딩",
    model: "text-embedding-3-large",
    provider: "OpenAI",
  },
  upstage: {
    name: "Upstage",
    description: "한국어 최적화 임베딩",
    model: "solar-embedding-1-large",
    provider: "Upstage AI",
  },
};

// ================================
// Props 타입 정의
// ================================

interface SidebarProps {
  selectedEmbedding: EmbeddingType;
  onSelect: (type: EmbeddingType) => void;
  disabled?: boolean;
}

// ================================
// Sidebar 컴포넌트
// ================================

export default function Sidebar({
  selectedEmbedding,
  onSelect,
  disabled = false,
}: SidebarProps) {
  const selectedModel = EMBEDDING_MODELS[selectedEmbedding];

  return (
    <aside className="w-64 bg-gray-900 text-white flex flex-col h-full">
      {/* 헤더 */}
      <div className="p-4 border-b border-gray-700">
        <h2 className="text-lg font-semibold">임베딩 모델</h2>
        <p className="text-xs text-gray-400 mt-1">
          RAG 검색에 사용할 모델 선택
        </p>
      </div>

      {/* 모델 선택 */}
      <div className="p-4 space-y-3">
        {(Object.keys(EMBEDDING_MODELS) as EmbeddingType[]).map((type) => {
          const model = EMBEDDING_MODELS[type];
          const isSelected = selectedEmbedding === type;

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
                name="embedding"
                value={type}
                checked={isSelected}
                onChange={() => onSelect(type)}
                disabled={disabled}
                className="mt-1 mr-3"
              />
              <div className="flex-1">
                <div className="font-medium">{model.name}</div>
                <div className="text-xs text-gray-300 mt-0.5">
                  {model.description}
                </div>
              </div>
            </label>
          );
        })}
      </div>

      {/* 선택된 모델 정보 */}
      <div className="mt-auto p-4 border-t border-gray-700 bg-gray-800/50">
        <h3 className="text-sm font-medium text-gray-300 mb-2">모델 정보</h3>
        <dl className="space-y-1 text-xs">
          <div className="flex justify-between">
            <dt className="text-gray-500">Provider</dt>
            <dd className="text-gray-300">{selectedModel.provider}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-gray-500">Model</dt>
            <dd className="text-gray-300 font-mono text-[10px]">
              {selectedModel.model}
            </dd>
          </div>
        </dl>
      </div>

      {/* 안내 문구 */}
      <div className="p-4 text-xs text-gray-500">
        모델 변경 시 대화가 초기화됩니다
      </div>
    </aside>
  );
}
