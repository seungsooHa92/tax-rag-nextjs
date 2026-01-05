"use client";

// ================================
// QueryClient Provider
// ================================
// TanStack Query를 사용하기 위해 필요한 Provider입니다.
// 앱 전체를 감싸서 어디서든 useQuery, useMutation을 사용할 수 있게 합니다.
//
// [주의사항]
// - "use client" 지시어가 필요합니다 (Client Component에서만 사용 가능)
// - QueryClient는 한 번만 생성해야 합니다 (useState 사용)

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient를 상태로 관리하여 매 렌더링마다 새로 생성되지 않도록 함
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // 윈도우 포커스 시 자동 재요청 비활성화
            refetchOnWindowFocus: false,
            // 에러 시 재시도 횟수
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
