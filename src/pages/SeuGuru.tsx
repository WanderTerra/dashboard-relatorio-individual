import React, { useState, useRef, useEffect } from 'react';
import { Bot, Users, Brain, Target, MessageSquare, Sparkles, ChevronDown, ChevronUp, Send, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  gradient: string;
  category: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  assistant_used?: string;
}

const SeuGuru: React.FC = () => {
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const typingIntervalRef = useRef<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Limpeza de intervalos ao desmontar
  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    };
  }, []);

  // Lista de assistentes disponíveis
  const assistants: Assistant[] = [
    {
      id: 'attendance',
      name: 'Guru da Conciliação',
      description: 'Especialista em critérios de avaliação e performance',
      icon: <Target size={24} />,
      color: '#3b82f6',
      gradient: 'from-blue-400 to-blue-600',
      category: 'Atendimento'
    },
    {
      id: 'hr',
      name: 'Guru do RH',
      description: 'Informações sobre políticas e procedimentos',
      icon: <Users size={24} />,
      color: '#10b981',
      gradient: 'from-green-400 to-green-600',
      category: 'Recursos Humanos'
    },
    {
      id: 'psychological',
      name: 'NeuraArmy',
      description: 'Suporte para bem-estar e desenvolvimento pessoal',
      icon: <Brain size={24} />,
      color: '#8b5cf6',
      gradient: 'from-purple-400 to-purple-600',
      category: 'Bem-estar'
    }
  ];

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para efeito de digitação
  const typeOutMessage = (text: string, messageId: string, speedMs = 15) => {
    return new Promise<void>((resolve) => {
      setIsTyping(true);
      let index = 0;
      typingIntervalRef.current = window.setInterval(() => {
        index += 2; // acrescenta alguns caracteres por tick
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, content: text.slice(0, Math.min(index, text.length)) } : m));
        if (index >= text.length) {
          if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
            typingIntervalRef.current = null;
          }
          setIsTyping(false);
          resolve();
        }
      }, speedMs);
    });
  };

  // (Removido) Mensagem de boas-vindas inicial — o usuário já escolheu um assistente ao abrir o chat

  const handleAssistantSelect = (assistantId: string) => {
    if (selectedAssistant === assistantId) {
      // Deseleciona se clicar no mesmo
      setSelectedAssistant(null);
      setIsExpanded(false);
    } else {
      setSelectedAssistant(assistantId);
      setIsExpanded(true);

      // Adiciona mensagem de seleção
      const selectedAssistantData = assistants.find(a => a.id === assistantId);
      const selectionMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Excelente escolha! 🏆\n\nAgora estou no modo **${selectedAssistantData?.name}**. Posso te ajudar com:\n\n• Dúvidas sobre critérios de avaliação\n• Análise de performance\n• Orientações sobre procedimentos\n• Informações específicas da área\n\nO que gostaria de saber?`,
        timestamp: new Date(),
        assistant_used: assistantId
      };
      setMessages(prev => [...prev, selectionMessage]);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || !selectedAssistant) return;

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
          agent_id: String(user?.id ?? '1111'),
          assistant_type: selectedAssistant,
        })
      });

      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`Erro ao enviar mensagem (status ${response.status}): ${body}`);
      }

      const data = await response.json();
      const fullText: string = data?.message ?? '';

      const assistantMessageId = (Date.now() + 1).toString();
      const emptyAssistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        assistant_used: selectedAssistant
      };
      setMessages(prev => [...prev, emptyAssistantMessage]);

      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
      await typeOutMessage(fullText, assistantMessageId, 10);

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

  const getSelectedAssistantData = () => {
    return assistants.find(a => a.id === selectedAssistant);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <PageHeader
        title="Seu Guru"
        subtitle="Escolha seu assistente especializado"
      />

      <div className="p-6 flex flex-col min-h-[calc(100vh-12rem)]">
        {/* Cards dos Assistentes - Animados */}
        <div className={`transition-all duration-700 ease-in-out ${
          isExpanded
            ? 'h-24 mb-6 opacity-100'
            : 'flex-1 mb-8 opacity-100'
        }`}>
          <div className={`flex justify-center items-center transition-all duration-700 ease-in-out ${
            isExpanded
              ? 'transform scale-75 -translate-y-4'
              : 'transform scale-100 translate-y-0'
          }`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {assistants.map((assistant, index) => (
              <div
                key={assistant.id}
                onClick={() => handleAssistantSelect(assistant.id)}
                className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl cursor-pointer transform transition-all duration-500 ease-out ${
                  selectedAssistant === assistant.id
                    ? 'ring-4 ring-blue-300 shadow-2xl'
                    : 'hover:scale-105'
                } ${
                  isExpanded ? 'hover:scale-110' : 'hover:scale-105'
                }`}
                style={{
                  animationDelay: `${index * 150}ms`,
                  background: `linear-gradient(135deg, ${assistant.color}15, ${assistant.color}05)`,
                  height: isExpanded ? 'auto' : '256px'
                }}
              >
                {/* Card Background com Gradiente */}
                <div className={`absolute inset-0 bg-gradient-to-br ${assistant.gradient} transition-opacity duration-300 ${
                  isExpanded ? 'opacity-60' : 'opacity-90 group-hover:opacity-100'
                }`} />

                {/* Conteúdo do Card */}
                <div className={`relative transition-all duration-500 ease-in-out ${
                  isExpanded ? 'p-4 h-16 flex items-center justify-center' : 'p-8 h-64 flex flex-col justify-between'
                }`}>
                  {/* Conteúdo Dinâmico - Ícone Apenas ou Conteúdo Completo */}
                  {isExpanded ? (
                    /* Modo Minimizado - Apenas Ícone */
                    <div className="flex items-center justify-center">
                      <div className={`w-12 h-12 rounded-xl bg-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg transition-all duration-300 ${
                        selectedAssistant === assistant.id ? 'bg-white/40 scale-110' : 'group-hover:scale-110'
                      }`}>
                        <div className={`text-white transition-all duration-300 ${
                          selectedAssistant === assistant.id ? 'scale-110' : ''
                        }`}>
                          {assistant.icon}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Modo Expandido - Conteúdo Completo */
                    <>
                      {/* Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300 ${
                            selectedAssistant === assistant.id ? 'bg-white/30' : ''
                          }`}>
                            <div className="text-white">
                              {assistant.icon}
                            </div>
                          </div>
                          <div>
                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-white transition-colors">
                              {assistant.name}
                            </h3>
                            <p className="text-white/80 text-sm leading-relaxed">
                              {assistant.description}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Badge de Categoria */}
                      <div className="flex justify-between items-end">
                        <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-medium text-white">
                          {assistant.category}
                        </span>

                        {/* Indicador de Seleção */}
                        {selectedAssistant === assistant.id && (
                          <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <Sparkles size={16} className="text-blue-600" />
                          </div>
                        )}
                      </div>

                      {/* Efeitos de Hover */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </>
                  )}

                  {/* Animação de Seleção */}
                  {selectedAssistant === assistant.id && (
                    <div className="absolute inset-0 bg-blue-400/20 animate-pulse rounded-2xl" />
                  )}
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        {/* Área de Chat Expandida */}
        <div className={`transition-all duration-700 ease-in-out ${
          isExpanded
            ? 'flex-1 opacity-100'
            : 'h-0 opacity-0 overflow-hidden'
        }`}>
          {isExpanded && selectedAssistant && (
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 h-full flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
              {/* Header do Chat */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                      {getSelectedAssistantData()?.icon}
                    </div>
                    <div>
                      <h3 className="font-bold">{getSelectedAssistantData()?.name}</h3>
                      <p className="text-sm opacity-90">Conectado e pronto para ajudar</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedAssistant(null);
                      setIsExpanded(false);
                    }}
                    className="text-white/80 hover:text-white transition-colors"
                  >
                    <ChevronUp size={24} />
                  </button>
                </div>
              </div>

              {/* Mensagens */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${
                      message.id === 'welcome' ? 'animate-in fade-in-0 slide-in-from-left-4 duration-700' : ''
                    }`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                        {assistants.find(a => a.id === message.assistant_used)?.icon || <Bot size={16} className="text-blue-600" />}
                      </div>
                    )}

                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm leading-relaxed">{message.content}</div>
                    </div>

                    {message.role === 'user' && (
                      <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={16} className="text-gray-600" />
                      </div>
                    )}
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Bot size={16} className="text-blue-600" />
                    </div>
                    <div className="bg-white rounded-2xl px-4 py-3 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Loader2 size={16} className="animate-spin" />
                        <span>Pensando...</span>
                      </div>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input de Mensagem */}
              <div className="border-t p-4 bg-white">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <textarea
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Digite sua mensagem aqui... (Enter para enviar, Shift+Enter para nova linha)"
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
              </div>
            </div>
          )}
        </div>

        {/* Botão para Expandir/Recolher quando há assistente selecionado */}
        {selectedAssistant && !isExpanded && (
          <div className="fixed bottom-6 right-6 z-10">
            <button
              onClick={() => setIsExpanded(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 animate-bounce"
            >
              <MessageSquare size={24} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SeuGuru;