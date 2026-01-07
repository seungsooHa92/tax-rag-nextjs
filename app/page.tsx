import { redirect } from "next/navigation";

// ================================
// 메인 페이지 → /openai로 리다이렉트
// ================================

export default function Home() {
  redirect("/openai");
}
