import React, { useEffect, useRef, useState } from "react";
import {
  Bot,
  Brain,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import PageHeader from "../components/PageHeader";
import { useAuth } from "../contexts/AuthContext";

type AssistantKey = "attendance" | "hr" | "psychological";

type AssistantCard = {
  id: AssistantKey;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ReactNode;
  gradient: string;
  highlights: string[];
};

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  metadata?: {
    related_criteria?: string[];
    suggested_actions?: string[];
    data_sources?: string[];
  };
}

const assistantCards: AssistantCard[] = [
  {
    id: "attendance",
    title: "Seu Guru – Atendimento",
    subtitle: "Negociação e critérios",
    description:
      "Especialista em carteiras, critérios de avaliação, scripts e performance.",
    icon: <Target size={26} className="text-white" />,
    gradient: "from-blue-500 via-blue-400 to-sky-400",
    highlights: [
      "Critérios e rotinas das carteiras",
      "Análise de performance individual",
      "Sugestões práticas para objeções",
    ],
  },
  {
    id: "hr",
    title: "Seu Guru – RH",
    subtitle: "Políticas e benefícios",
    description:
      "Consultor sobre políticas internas, benefícios, férias e rotinas administrativas.",
    icon: <Users size={26} className="text-white" />,
    gradient: "from-emerald-500 via-green-400 to-teal-400",
    highlights: [
      "Regras de férias e afastamentos",
      "Benefícios e elegibilidade",
      "Procedimentos e documentações",
    ],
  },
  {
    id: "psychological",
    title: "Seu Guru – Bem-estar",
    subtitle: "Check-in diário",
    description:
      "Apoio acolhedor para refletir sobre bem-estar, rotina e desenvolvimento pessoal.",
    icon: <Brain size={26} className="text-white" />,
    gradient: "from-purple-500 via-violet-400 to-indigo-400",
    highlights: [
      "Check-in emocional diário",
      "Orientações de autocuidado",
      "Encaminhamentos quando necessário",
    ],
  },
];

const quickPrompts: Record<AssistantKey, string[]> = {
  attendance: [
    "Quais são as regras de desconto da Águas Guariroba?",
    "Como argumento quando o cliente diz que já pagou?",
    "Quais pontos preciso reforçar no critério de cumprimento?",
  ],
  hr: [
    "Quais são os benefícios oferecidos?",
    "Como solicitar minhas férias?",
    "Qual o procedimento para atestado médico?",
  ],
  psychological: [
    "Estou me sentindo ansioso hoje, o que posso fazer?",
    "Como manter o foco nas metas sem me sobrecarregar?",
    "Tem alguma dica para me organizar melhor nesta semana?",
  ],
};

const assistantIcons: Record<AssistantKey, React.ReactNode> = {
  attendance: <Target size={18} className="text-blue-500" />,
  hr: <Users size={18} className="text-emerald-500" />,
  psychological: <Brain size={18} className="text-purple-500" />,
};

const SeuGuruPage: React.FC = () => {
  const { user } = useAuth();
  const [selectedAssistant, setSelectedAssistant] = useState<AssistantKey | null>(
    null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const resetConversation = (assistant: AssistantKey) => {
    setSelectedAssistant(assistant);
    setMessages([
      {
        id: "welcome",
        role: "assistant",
        content: `Você selecionou o ${assistantCards.find(
          (card) => card.id === assistant
        )?.title || "Seu Guru"}. Como posso ajudar hoje?`,
        timestamp: new Date(),
      },
    ]);
    setConversationId(null);
    setInputMessage("");
  };

  const sendMessage = async () => {
    if (!selectedAssistant) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now().toString(),
          role: "assistant",
          content:
            "Escolha um assistente acima para iniciar a conversa.",
          timestamp: new Date(),
        },
      ]);
      return;
    }

    if (!inputMessage.trim() || isLoading) return;

    const trimmedMessage = inputMessage.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: trimmedMessage,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const token = localStorage.getItem("auth_token");
      const payload: Record<string, unknown> = {
        message: trimmedMessage,
        assistant_type: selectedAssistant,
      };

      const rawAgentId = user?.agent_id ?? user?.id;
      if (rawAgentId !== undefined && rawAgentId !== null) {
        payload.agent_id = String(rawAgentId);
      }

      if (conversationId !== null) {
        payload.conversation_id = conversationId;
      }

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: `${Date.now()}_${Math.random()}`,
        role: "assistant",
        content: data.message,
        timestamp: new Date(),
        metadata: data.metadata || undefined,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setConversationId(data.conversation_id ?? conversationId);
    } catch (error) {
      console.error("Erro ao enviar mensagem:", error);
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}_error`,
          role: "assistant",
          content:
            "Não consegui processar sua mensagem agora. Tente novamente em instantes.",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  const renderMetadata = (metadata?: Message["metadata"]) => {
    if (!metadata) return null;
    const { related_criteria, suggested_actions, data_sources } = metadata;

    return (
      <div className="mt-2 border-t border-gray-200 pt-2 space-y-2">
        {related_criteria && related_criteria.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-700">
              Critérios relacionados:
            </span>
            <div className="mt-1 space-y-1">
              {related_criteria.map((item, index) => (
                <p key={index}>• {item}</p>
              ))}
            </div>
          </div>
        )}

        {suggested_actions && suggested_actions.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-700">
              Ações sugeridas:
            </span>
            <div className="mt-1 space-y-1">
              {suggested_actions.map((item, index) => (
                <p key={index} className="flex items-start gap-1">
                  <Sparkles size={12} className="mt-0.5 text-yellow-500" />
                  {item}
                </p>
              ))}
            </div>
          </div>
        )}

        {data_sources && data_sources.length > 0 && (
          <div className="text-xs text-gray-600">
            <span className="font-semibold text-gray-700">Fontes:</span>
            <ul className="mt-1 space-y-1">
              {data_sources.map((item, index) => (
                <li key={index}>• {item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      <PageHeader
        title="Seu Guru"
        subtitle="Escolha o especialista e conduza a conversa conforme sua necessidade"
      />

      <div className="grid gap-4 p-6 lg:grid-cols-3">
        {assistantCards.map((card) => (
          <button
            key={card.id}
            onClick={() => resetConversation(card.id)}
            className={`group flex flex-col items-start gap-4 rounded-2xl border border-transparent p-5 text-left transition-all duration-200 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              selectedAssistant === card.id
                ? "bg-white shadow-lg ring-2 ring-offset-2 ring-blue-500"
                : "bg-white shadow-md hover:border-blue-200"
            }`}
          >
            <div
              className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${card.gradient} shadow-lg`}
            >
              {card.icon}
            </div>
            <div className="space-y-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {card.title}
                </h3>
                <p className="text-sm font-medium text-gray-500">
                  {card.subtitle}
                </p>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                {card.description}
              </p>
              <ul className="space-y-1 text-sm text-gray-600">
                {card.highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-blue-400"></span>
                    {highlight}
                  </li>
                ))}
              </ul>
            </div>
          </button>
        ))}
      </div>

      <div className="px-6 pb-10">
        <div className="rounded-2xl border border-gray-200 bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <div>
              <h4 className="text-base font-semibold text-gray-900">
                Conversa com o Seu Guru
              </h4>
              <p className="text-sm text-gray-500">
                {selectedAssistant
                  ? `Assistente selecionado: ${assistantCards.find(
                      (card) => card.id === selectedAssistant
                    )?.subtitle}`
                  : "Selecione um assistente acima para iniciar a conversa."}
              </p>
            </div>
            {selectedAssistant && (
              <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-sm text-gray-600">
                {assistantIcons[selectedAssistant]}
                <span>
                  {assistantCards.find((card) => card.id === selectedAssistant)?.subtitle}
                </span>
              </div>
            )}
          </div>

          <div className="flex h-[520px] flex-col">
            <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                      message.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-gray-50 text-gray-800 border border-gray-200"
                    }`}
                  >
                    <div className="whitespace-pre-wrap text-sm leading-relaxed">
                      {message.content}
                    </div>
                    {message.role === "assistant" && renderMetadata(message.metadata)}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-600">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processando sua pergunta...
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
              <div className="flex items-end gap-3">
                <textarea
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={
                    selectedAssistant
                      ? "Digite sua mensagem (Enter para enviar, Shift+Enter para nova linha)"
                      : "Selecione um assistente para habilitar o chat"
                  }
                  className="min-h-[56px] flex-1 resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:bg-gray-100"
                  disabled={!selectedAssistant || isLoading}
                />
                <button
                  onClick={sendMessage}
                  disabled={!selectedAssistant || !inputMessage.trim() || isLoading}
                  className="flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <Send size={16} />
                  )}
                  Enviar
                </button>
              </div>

              {selectedAssistant && quickPrompts[selectedAssistant].length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Sugestões rápidas
                  </span>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {quickPrompts[selectedAssistant].map((prompt, index) => (
                      <button
                        key={index}
                        onClick={() => setInputMessage(prompt)}
                        className="rounded-full border border-gray-300 bg-white px-3 py-1 text-xs text-gray-600 transition-colors duration-150 hover:border-blue-300 hover:text-blue-600"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeuGuruPage;
