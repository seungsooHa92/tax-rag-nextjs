/** @type {import('next').NextConfig} */
const nextConfig = {
  // LangChain 서버 컴포넌트에서 사용하기 위한 설정
  experimental: {
    serverComponentsExternalPackages: ["langchain", "@langchain/openai", "@langchain/community"],
  },
};

module.exports = nextConfig;
