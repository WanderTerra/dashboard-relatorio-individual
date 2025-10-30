import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Sparkles, XCircle, Loader2, Bot } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { generateAISuggestion, checkAIAvailability } from '../lib/ai-suggestion-api';

interface AIAgentSuggestionProps {
  worstCriterion: {
    categoria: string;
    taxa_nao_conforme: number;
  };
  agentName?: string;
  agentId?: string;
  recentPerformance?: any[];
}

interface AISuggestion {
  title: string;
  summary: string;
  specificActions: string[];
  expectedImprovement: string;
  priority: 'high' | 'medium' | 'low';
  timeToImplement: string;
}

const AIAgentSuggestion: React.FC<AIAgentSuggestionProps> = ({ 
  worstCriterion, 
  agentName = 'Conciliador',
  agentId,
  recentPerformance = []
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [suggestion, setSuggestion] = useState<AISuggestion | null>(null);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Usar ref para evitar re-renders desnecessários
  const loadedRef = useRef(false);
  const currentKeyRef = useRef('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Criar uma chave única baseada nos dados essenciais
  const stableKey = useMemo(() => {
    return `${agentId}-${worstCriterion.categoria}-${worstCriterion.taxa_nao_conforme.toFixed(1)}`;
  }, [agentId, worstCriterion.categoria, worstCriterion.taxa_nao_conforme]);

  // Carregar sugestão apenas uma vez por chave única
  useEffect(() => {
    // Se já carregou para esta chave, não carregar novamente
    if (loadedRef.current && currentKeyRef.current === stableKey) {
      console.log('🔒 Já carregado, ignorando chamada duplicada');
      return;
    }

    // Reset para nova chave
    if (currentKeyRef.current !== stableKey) {
      loadedRef.current = false;
      currentKeyRef.current = stableKey;
    }

    const loadAISuggestion = async () => {
      setIsLoading(true);
      try {
        // Verificar se o backend está disponível
        const aiAvailable = await checkAIAvailability();
        setAiAvailable(aiAvailable);

        // Gerar sugestão usando o backend
        const aiSuggestion = await generateAISuggestion({
          agentName,
          worstCriterion,
          agentId: agentId || '',
          recentPerformance
        });

        console.log('🤖 Sugestão recebida do backend:', aiSuggestion);
        setSuggestion(aiSuggestion);
        loadedRef.current = true; // Marcar como carregado
      } catch (error) {
        console.error('❌ Erro ao carregar sugestão de IA:', error);
        setSuggestion(null);
        loadedRef.current = true; // Marcar como carregado mesmo com erro
      } finally {
        setIsLoading(false);
      }
    };

    loadAISuggestion();
  }, [stableKey]); // Apenas stableKey como dependência

  // Animação de digitação para a explicação da IA
  useEffect(() => {
    // Limpar intervalo anterior se existir
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }

    if (!suggestion || !suggestion.specificActions || !suggestion.specificActions[0]) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    const fullText = suggestion.specificActions[0];
    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    typingIntervalRef.current = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(prev => fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        setIsTyping(false);
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 30); // Velocidade de digitação: 30ms por caractere

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, [suggestion]);

  // Se ainda está carregando, mostrar loading
  if (isLoading) {
    return (
      <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
        {/* Header com gradiente */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg">
              IA - Analisando {agentName}
            </h4>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="relative">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
              </div>
              <p className="text-gray-600 font-medium">Gerando sugestões personalizadas...</p>
              <p className="text-sm text-gray-500 mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Se não há sugestão, não renderizar nada
  if (!suggestion) {
    return null;
  }

  // Limitar título a no máximo 100 caracteres
// Usa o título do backend (já limitado) e aplica um hard-cap local por segurança
const title = (suggestion.title ?? 'Sugestão de Melhoria').slice(0, 100);

  return (
    <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 overflow-hidden">
      {/* Header com gradiente */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <XCircle className="w-5 h-5 text-white" />
            </div>
            <h4 className="font-bold text-white text-lg">
              {title}
            </h4>
          </div>
          <div className="flex items-center space-x-2">
            <div className="px-3 py-1 bg-white/20 rounded-full backdrop-blur-sm">
              <span className="text-xs font-medium text-white">
                {aiAvailable ? 'Análise Inteligente' : 'Análise Inteligente'}
              </span>
            </div>
            <Sparkles className="w-4 h-4 text-yellow-300" />
          </div>
        </div>
      </div>

      <CardContent className="p-6 space-y-6">
        {/* Métrica Principal */}
        <div className="bg-gradient-to-r from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-700 mb-1">
                Taxa de não conformidade
              </p>
              <p className="text-3xl font-bold text-red-800">
                {worstCriterion.taxa_nao_conforme.toFixed(1)}%
              </p>
            </div>
            <div className="w-16 h-16 bg-red-200 rounded-full flex items-center justify-center">
              <div className="w-12 h-12 bg-red-300 rounded-full flex items-center justify-center">
                <span className="text-lg font-bold text-red-800">
                  {worstCriterion.taxa_nao_conforme.toFixed(0)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sugestão de Melhoria */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-200">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-500 rounded-lg flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-blue-800 mb-2">
                Explicação da IA
              </p>
              <p className="text-base text-blue-900 font-medium leading-relaxed">
                {displayedText}
                {isTyping && (
                  <span className="inline-block w-0.5 h-4 bg-blue-900 ml-1 animate-pulse"></span>
                )}
                {!suggestion && 'Analisando seus dados para identificar melhorias específicas...'}
              </p>
            </div>
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default AIAgentSuggestion;
