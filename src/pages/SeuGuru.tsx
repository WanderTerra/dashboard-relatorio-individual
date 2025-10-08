import React, { useState, useRef, useEffect } from 'react';
import { Users, Brain, Target, MessageSquare, Sparkles, Send, Loader2, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface Assistant {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  color: string;
  gradient: string;
  category: string;
  welcomeMessage: string;
}

interface QuickReply {
  label: string;
  query: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  assistant_used?: string;
  quick_replies?: QuickReply[];
}

const SeuGuru: React.FC = () => {
  const [selectedAssistant, setSelectedAssistant] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatOpened, setChatOpened] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Lista de assistentes disponíveis
  const assistants: Assistant[] = [
    {
      id: 'attendance',
      name: 'Guru da Conciliação',
      description: 'Especialista em critérios de avaliação e performance',
      icon: <Target size={32} />,
      color: '#3b82f6',
      gradient: 'from-blue-500 to-blue-700',
      category: 'Atendimento',
      welcomeMessage: 'Olá! 👋 Sou o **Guru da Conciliação**.\n\nEstou aqui para te ajudar com:\n\n• Dúvidas sobre critérios de avaliação\n• Análise de performance\n• Técnicas de conciliação\n• Orientações sobre procedimentos\n\nComo posso te ajudar hoje?'
    },
    {
      id: 'hr',
      name: 'Guru do RH',
      description: 'Informações sobre políticas e procedimentos',
      icon: <Users size={32} />,
      color: '#10b981',
      gradient: 'from-green-500 to-emerald-700',
      category: 'Recursos Humanos',
      welcomeMessage: 'Olá! 👋 Sou o **Guru do RH**.\n\nPosso te ajudar com:\n\n• Políticas da empresa\n• Benefícios e direitos\n• Procedimentos internos\n• Questões trabalhistas\n\nO que você gostaria de saber?'
    },
    {
      id: 'psychological',
      name: 'NeuraArmy',
      description: 'Suporte para bem-estar e desenvolvimento pessoal',
      icon: <Brain size={32} />,
      color: '#8b5cf6',
      gradient: 'from-purple-500 to-violet-700',
      category: 'Bem-estar',
      welcomeMessage: 'Olá! 👋 Sou a **NeuraArmy**.\n\nEstou aqui para apoiar seu:\n\n• Bem-estar mental e emocional\n• Desenvolvimento pessoal\n• Gestão de estresse\n• Equilíbrio trabalho-vida\n\nComo posso te apoiar hoje?'
    }
  ];

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Função para selecionar assistente e abrir chat
  const handleAssistantSelect = (assistantId: string) => {
    console.log('✅ Assistente selecionado:', {
      id: assistantId,
      nome: assistants.find(a => a.id === assistantId)?.name
    });
    
    setSelectedAssistant(assistantId);
    setChatOpened(true);
    
    // Limpar mensagens antigas
    setMessages([]);
    
    // Adicionar mensagem de boas-vindas
    const selectedAssistantData = assistants.find(a => a.id === assistantId);
    if (selectedAssistantData) {
      const welcomeMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: selectedAssistantData.welcomeMessage,
        timestamp: new Date(),
        assistant_used: assistantId
      };
      setMessages([welcomeMessage]);
    }
  };

  // Função para voltar à seleção de assistente
  const handleBackToSelection = () => {
    setChatOpened(false);
    setSelectedAssistant(null);
    setMessages([]);
    setInputMessage('');
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

      // Log para debug
      const requestPayload = {
        message: userMessage.content,
        agent_id: String(user?.id ?? '1111'),
        assistant_type: selectedAssistant,
      };
      
      console.log('🔍 Enviando para backend:', {
        endpoint: '/api/ai/chat/stream',
        assistente_selecionado: selectedAssistant,
        payload: requestPayload
      });

      // Tentar primeiro o endpoint de streaming
      let response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(requestPayload)
      });

      if (!response.ok) {
        throw new Error(`Erro ao enviar mensagem (status ${response.status})`);
      }

      // Criar mensagem do assistente
      const assistantMessageId = (Date.now() + 1).toString();
      const assistantMessage: Message = {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        timestamp: new Date(),
        assistant_used: selectedAssistant
      };
      setMessages(prev => [...prev, assistantMessage]);

      // Sempre tratar como streaming - mais rápido e direto
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';
      let quickReplies: QuickReply[] = [];

      setIsStreaming(true);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.slice(6);
              try {
                const event = JSON.parse(jsonStr);
                
                if (event.type === 'token') {
                  fullResponse += event.content;
                  
                  // Mostrar conteúdo em tempo real conforme chega
                  if (fullResponse.trim()) {
                    setMessages(prev => prev.map(m => 
                      m.id === assistantMessageId 
                        ? { ...m, content: fullResponse }
                        : m
                    ));
                  }
                }
                else if (event.type === 'quick_replies') {
                  quickReplies = event.replies || [];
                  // Adicionar quick replies à mensagem IMEDIATAMENTE
                  setMessages(prev => prev.map(m => 
                    m.id === assistantMessageId 
                      ? { ...m, quick_replies: quickReplies }
                      : m
                  ));
                }
              } catch (e) {
                // Linha não é JSON válido, ignora
              }
            }
          }
        }
      }

    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      // Criar mensagem de erro
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleQuickReply = (query: string) => {
    if (isLoading) return;
    setInputMessage(query);
    // Pequeno delay para mostrar a query no input antes de enviar
    setTimeout(() => sendMessage(), 100);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Auto-resize da textarea
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 200) + 'px';
    }
  }, [inputMessage]);

  // Auto-focus quando o chat abre
  useEffect(() => {
    if (chatOpened && textareaRef.current) {
      // Pequeno delay para garantir que a animação de transição termine
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 300);
    }
  }, [chatOpened]);

  const getSelectedAssistantData = () => {
    return assistants.find(a => a.id === selectedAssistant);
  };


  const renderMessageContent = (message: Message) => {
    if (!message.content && isLoading && message.role === 'assistant') {
      return "Pensando...".split('').map((char, index) => 
        `<span class="inline-block animate-bounce" style="animation-delay: ${index * 30}ms; animation-duration: 1.5s;">${char === ' ' ? '&nbsp;' : char}</span>`
      ).join('');
    }
    
    // O conteúdo já vem parseado do backend, apenas aplicar formatação markdown
    return message.content
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/•/g, '<span class="inline-block mr-2">•</span>')
      .replace(/\n/g, '<br/>');
  };

  // Se o chat estiver aberto, mostrar apenas o chat em tela cheia
  if (chatOpened && selectedAssistant) {
    const assistant = getSelectedAssistantData();
    
    return (
      <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
        {/* Header do Chat - Fixo */}
        <div className={`bg-gradient-to-r ${assistant?.gradient} p-4 shadow-lg`}>
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            <div className="flex items-center gap-4">
              <button
                onClick={handleBackToSelection}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-white" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                  {assistant?.icon}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{assistant?.name}</h2>
                  <p className="text-sm text-white/80">
                    {isStreaming ? 'Digitando...' : 'Online • Pronto para ajudar'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                <span className="text-sm font-medium text-white">{assistant?.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Área de Mensagens - Scroll */}
        <div className="flex-1 overflow-y-auto bg-gray-50">
          <div className="max-w-5xl mx-auto p-6 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className="space-y-3"
              >
                <div
                  className={`flex gap-4 animate-in slide-in-from-bottom-2 duration-500 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
                      style={{ background: `linear-gradient(135deg, ${assistant?.color}, ${assistant?.color}dd)` }}
                    >
                      <div className="text-white scale-75">
                        {assistant?.icon}
                      </div>
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-4 shadow-sm ${
                      message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                  <div 
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{ 
                      __html: renderMessageContent(message)
                    }} 
                  />
                    <p className={`text-xs mt-2 ${message.role === 'user' ? 'text-white/60' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg">
                      <MessageSquare size={20} className="text-white" />
                    </div>
                  )}
                </div>

                {/* Quick Replies */}
                {message.role === 'assistant' && message.quick_replies && message.quick_replies.length > 0 && (
                  <div className="flex flex-wrap gap-2 ml-14 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                    {message.quick_replies.map((reply: QuickReply, idx: number) => (
                      <button
                        key={idx}
                        onClick={() => handleQuickReply(reply.query)}
                        disabled={isLoading}
                        className="px-4 py-2 bg-white border-2 text-sm font-medium rounded-full hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          borderColor: assistant?.color,
                          color: assistant?.color,
                          backgroundColor: `${assistant?.color}15`
                        }}
                      >
                        {reply.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}


            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input de Mensagem - Fixo - Estilo Chat Moderno */}
        <div className="bg-white border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-6 py-4">
            {/* Container do Input */}
            <div className="flex items-end gap-3">
              {/* Textarea com container */}
              <div className="flex-1 relative">
                <div className={`flex items-end bg-gray-50 rounded-3xl border-2 transition-all ${
                  inputMessage.trim() ? 'border-blue-300 bg-white' : 'border-gray-200'
                }`}>
                  <textarea
                    ref={textareaRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 px-5 py-4 bg-transparent resize-none text-gray-900 placeholder-gray-400 focus:outline-none max-h-[200px] min-h-[56px]"
                    rows={1}
                    disabled={isLoading}
                    style={{ lineHeight: '1.5' }}
                  />
                  
                  {/* Indicador de atalho */}
                  {!inputMessage && (
                    <div className="absolute right-5 bottom-5 text-xs text-gray-400 pointer-events-none hidden sm:block">
                      <kbd className="px-2 py-1 bg-gray-100 rounded text-gray-500 font-mono">Enter</kbd> para enviar
                    </div>
                  )}
                </div>
                
                {/* Contador de caracteres (opcional) */}
                {inputMessage.length > 500 && (
                  <div className="absolute -top-6 right-0 text-xs text-gray-400">
                    {inputMessage.length} caracteres
                  </div>
                )}
              </div>

              {/* Botão de Enviar - Circular e moderno */}
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className={`w-14 h-14 rounded-full bg-gradient-to-r ${assistant?.gradient} text-white flex items-center justify-center shadow-lg hover:shadow-xl disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none transition-all duration-300 transform hover:scale-105 active:scale-95 flex-shrink-0`}
                title={inputMessage.trim() ? 'Enviar mensagem' : 'Digite algo para enviar'}
              >
                {isLoading ? (
                  <Loader2 size={22} className="animate-spin" />
                ) : (
                  <Send size={20} />
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Tela de seleção de assistente
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white/50 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Sparkles size={32} className="text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Seu Guru
            </h1>
            <p className="text-gray-600 text-lg">
              Escolha seu assistente especializado para começar um novo chat
            </p>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        {/* Grid de Cards dos Assistentes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl w-full">
          {assistants.map((assistant, index) => (
            <div
              key={assistant.id}
              onClick={() => handleAssistantSelect(assistant.id)}
              className="group relative overflow-hidden cursor-pointer transform transition-all duration-500 hover:scale-105 animate-in slide-in-from-bottom-4"
              style={{
                animationDelay: `${index * 150}ms`,
                minHeight: '400px',
                borderRadius: '24px'
              }}
            >
              {/* Background com Gradiente */}
              <div 
                className={`absolute inset-0 bg-gradient-to-br ${assistant.gradient} opacity-95 group-hover:opacity-100 transition-opacity duration-300 shadow-xl group-hover:shadow-2xl`}
                style={{ borderRadius: '24px' }}
              />

              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Conteúdo do Card */}
              <div className="relative h-full p-8 flex flex-col justify-between">
                {/* Ícone e Título */}
                <div className="space-y-6">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500">
                    <div className="text-white scale-110">
                      {assistant.icon}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-3xl font-bold text-white mb-3 group-hover:tracking-wide transition-all duration-300">
                      {assistant.name}
                    </h3>
                    <p className="text-white/90 text-base leading-relaxed">
                      {assistant.description}
                    </p>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                  <span className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-medium text-white shadow-lg">
                    {assistant.category}
                  </span>
                  
                  {/* Botão de Ação */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/30 backdrop-blur-sm rounded-full text-white font-medium group-hover:bg-white/40 transition-all duration-300">
                    <MessageSquare size={18} />
                    <span>Conversar</span>
                  </div>
                </div>

                {/* Decoração - Círculos */}
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rodapé com informação */}
      <div className="bg-white/30 backdrop-blur-sm border-t border-gray-200 py-4">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-gray-600 text-sm">
            Selecione um assistente para começar um novo chat
          </p>
        </div>
      </div>
    </div>
  );
};

export default SeuGuru;