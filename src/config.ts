import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
  transportType: process.env.TRANSPORT_TYPE === 'sse' ? 'sse' : 'stdio',
  openaiApiKey: process.env.OPENAI_API_KEY,
  anthropicApiKey: process.env.ANTHROPIC_API_KEY,
  figmaApiKey: process.env.FIGMA_API_KEY,
  twentyFirstApiKey: process.env.TWENTY_FIRST_API_KEY,
}; 