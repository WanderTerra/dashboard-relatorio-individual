// Configuração do backend com suporte a modelos configuráveis
export const aiConfig = {
  provider: 'backend', // Backend com suporte a OpenAI e fallback inteligente
  baseUrl: '', // Usando proxy do Vite
  enabled: true,
  // O backend agora suporta:
  // - AI_PROVIDER=openai + OPENAI_API_KEY para IA real
  // - Fallback inteligente se não configurado
  features: {
    realAI: true, // Backend pode usar OpenAI se configurado
    intelligentFallback: true, // Sempre disponível como fallback
    configurableModels: true // Suporte a diferentes modelos
  }
};