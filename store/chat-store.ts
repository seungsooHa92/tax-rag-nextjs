import { create } from "zustand";
import { ChatMessage, ModelType } from "@/types";

interface ChatStore {
  // 모델별 메시지 저장
  messagesByType: Record<ModelType, ChatMessage[]>;

  // 현재 선택된 모델
  modelType: ModelType;

  // Actions
  setModelType: (type: ModelType) => void;
  addMessage: (message: ChatMessage) => void;
  clearMessages: (type?: ModelType) => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messagesByType: {
    openai: [],
    upstage: [],
    "openai-pinecone": [],
    "upstage-pinecone": [],
  },

  modelType: "openai",

  setModelType: (type) => set({ modelType: type }),

  addMessage: (message) =>
    set((state) => ({
      messagesByType: {
        ...state.messagesByType,
        [state.modelType]: [
          ...state.messagesByType[state.modelType],
          message,
        ],
      },
    })),

  clearMessages: (type) =>
    set((state) => ({
      messagesByType: type
        ? { ...state.messagesByType, [type]: [] }
        : {
            openai: [],
            upstage: [],
            "openai-pinecone": [],
            "upstage-pinecone": [],
          },
    })),
}));
