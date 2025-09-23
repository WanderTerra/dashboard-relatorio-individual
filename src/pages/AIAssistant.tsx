import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Sparkles, Target, Users, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  metadata?: {
    assistant_used?: string;
    confidence?: number;
    suggested_actions?: string[];
    related_criteria?: string[];
    data_sources?: string[];
  };
}

interface Conversation {
  id: number;
  status: string;
  created_at: string;
  message_count?: number;
}

const AIAssistant: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mensagem de boas-vindas inicial
  useEffect(() => {
    if (messages.length === 0) {
      const welcomeMessage: Message = {
        id: 'welcome',
        role: 'assistant',
        content: `Olá ${user?.full_name || 'Agente'}! 👋\n\nSou seu assistente de IA e estou aqui para ajudar com:\n\n🎯 **Dúvidas de Atendimento** - Critérios, carteiras, performance\n👥 **Questões de RH** - Políticas, benefícios, procedimentos\n🧠 **Desenvolvimento Pessoal** - Bem-estar e crescimento\n\nComo posso ajudar você hoje?`,
        timestamp: new Date(),
        metadata: {
          assistant_used: 'orchestrator',
          confidence: 1.0
        }
      };
      setMessages([welcomeMessage]);
    }
  }, [user, messages.length]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessage.content,
          agent_id: user?.agent_id || user?.id || '1111',
          conversation_id: conversationId
        })
      });

      if (!response.ok) {
        throw new Error('Erro ao enviar mensagem');
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata ? {
          assistant_used: data.assistant_used,
          confidence: data.confidence,
          suggested_actions: data.suggested_actions,
          related_criteria: data.metadata.related_criteria,
          data_sources: data.metadata.data_sources
        } : undefined
      };

      setMessages(prev => [...prev, assistantMessage]);
      setConversationId(data.conversation_id);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getAssistantIcon = (assistantUsed?: string) => {
    switch (assistantUsed) {
      case 'attendance_assistant':
        return <Target size={16} className="text-blue-500" />;
      case 'hr_assistant':
        return <Users size={16} className="text-green-500" />;
      case 'psychological_assistant':
        return <Brain size={16} className="text-purple-500" />;
      default:
        return <Bot size={16} className="text-gray-500" />;
    }
  };

  const getAssistantName = (assistantUsed?: string) => {
    switch (assistantUsed) {
      case 'attendance_assistant':
        return 'Assistente de Atendimento';
      case 'hr_assistant':
        return 'Assistente de RH';
      case 'psychological_assistant':
        return 'Assistente Psicológico';
      default:
        return 'Assistente IA';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Bot className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Assistente de IA</h1>
              <p className="text-gray-600">Seu assistente inteligente para dúvidas e orientações</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Chat Container */}
        <div className="bg-white rounded-lg shadow-sm border h-[600px] flex flex-col">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    {getAssistantIcon(message.metadata?.assistant_used)}
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {getAssistantIcon(message.metadata.assistant_used)}
                        <span>{getAssistantName(message.metadata.assistant_used)}</span>
                        {message.metadata.confidence && (
                          <span>• {Math.round(message.metadata.confidence * 100)}% confiança</span>
                        )}
                      </div>
                      
                      {message.metadata.suggested_actions && message.metadata.suggested_actions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Sugestões:</p>
                          <ul className="text-xs text-gray-600 space-y-1">
                            {message.metadata.suggested_actions.map((action, index) => (
                              <li key={index} className="flex items-center gap-1">
                                <Sparkles size={12} className="text-yellow-500" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      
                      {message.metadata.data_sources && message.metadata.data_sources.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-700 mb-1">Fontes:</p>
                          <div className="text-xs text-gray-600">
                            {message.metadata.data_sources.join(' • ')}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {message.role === 'user' && (
                  <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                    <User size={16} className="text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-blue-500" />
                </div>
                <div className="bg-gray-100 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2 text-gray-600">
                    <Loader2 size={16} className="animate-spin" />
                    <span>Pensando...</span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-3">
              <div className="flex-1">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite sua pergunta aqui... (Enter para enviar, Shift+Enter para nova linha)"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                Enviar
              </button>
            </div>
            
            {/* Quick Actions */}
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="text-sm text-gray-500">Perguntas rápidas:</span>
              {[
                "Como melhorar minha performance?",
                "Quais são os critérios de avaliação?",
                "Como está minha média geral?",
                "Quais são meus pontos de atenção?"
              ].map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputMessage(question)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded-full transition-colors"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Atendimento</h3>
                <p className="text-sm text-gray-600">Dúvidas sobre carteiras e critérios</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <Users className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">RH</h3>
                <p className="text-sm text-gray-600">Políticas e procedimentos</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg shadow-sm border">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-medium text-gray-900">Bem-estar</h3>
                <p className="text-sm text-gray-600">Desenvolvimento pessoal</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
