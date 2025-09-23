import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2, MessageSquare, Sparkles, Target, Users, Brain } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';

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
        return '';
    }
  };

  return (
    <div>
      <PageHeader
        title="Assistente de IA"
        subtitle="Seu assistente inteligente para dúvidas e orientações"
      />

      <div className="p-6">
        {/* Chat Container */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 h-[600px] flex flex-col hover:shadow-xl transition-shadow duration-300">
          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.role === 'assistant' && (
                  <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                    {getAssistantIcon(message.metadata?.assistant_used)}
                  </div>
                )}
                
                <div
                  className={`max-w-[70%] rounded-xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-gray-50 text-gray-900 border border-gray-200'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {message.metadata && (
                    <div className="mt-2 pt-2 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {getAssistantIcon(message.metadata?.assistant_used)}
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
                  <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center shadow-sm border border-gray-200">
                    <User size={16} className="text-gray-700" />
                  </div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center shadow-sm">
                  <Bot size={16} className="text-blue-600" />
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
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
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-gray-900 placeholder-gray-500 bg-white"
                  rows={2}
                  disabled={isLoading}
                />
              </div>
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md"
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
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mb-2 block">Perguntas rápidas:</span>
              <div className="flex flex-wrap gap-2">
                {[
                  "Como melhorar minha performance?",
                  "Quais são os critérios de avaliação?",
                  "Como está minha média geral?",
                  "Quais são meus pontos de atenção?"
                ].map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="px-3 py-1 text-sm bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-all duration-200 hover:shadow-sm"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AIAssistant;
