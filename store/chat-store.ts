import { create } from "zustand";
import { ChatMessage, EmbeddingType } from "@/types";

interface ChatStore {
  // 임베딩별 메시지 저장
  messagesByType: Record<EmbeddingType, ChatMessage[]>;

  // 현재 선택된 임베딩
  embeddingType: EmbeddingType;

  // Actions
  setEmbeddingType: (type: EmbeddingType) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: (type?: EmbeddingType) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messagesByType: {
    openai: [],
    upstage: [],
  },

  embeddingType: "openai",

  setEmbeddingType: (type) => set({ embeddingType: type }),

  addMessage: (message) =>
    set((state) => ({
      messagesByType: {
        ...state.messagesByType,
        [state.embeddingType]: [
          ...state.messagesByType[state.embeddingType],
          message,
        ],
      },
    })),

  clearMessages: (type) =>
    set((state) => ({
      messagesByType: type
        ? { ...state.messagesByType, [type]: [] }
        : { openai: [], upstage: [] },
    })),
}));
