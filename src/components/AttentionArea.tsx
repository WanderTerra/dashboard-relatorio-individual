import React from 'react';
import { AlertTriangle, XCircle, CheckCircle, Lightbulb, Target, BookOpen, Users, Clock } from 'lucide-react';

interface AttentionItem {
  id: string;
  criteria: string;
  nonConformityRate: number;
  description: string;
  category: 'abordagem' | 'confirmacao' | 'checklist' | 'negociacao' | 'falha_critica' | 'encerramento';
}

interface AttentionAreaProps {
  attentionItems: AttentionItem[];
}

const AttentionArea: React.FC<AttentionAreaProps> = ({ attentionItems }) => {
  // Função para gerar sugestões baseadas no critério
  const getImprovementSuggestion = (item: AttentionItem) => {
    const { criteria, category, nonConformityRate } = item;
    
    // Sugestões por categoria
    const suggestions = {
      abordagem: {
        title: "Melhore sua Abordagem",
        tips: [
          "Use sempre o script de abertura padronizado",
          "Identifique-se claramente e explique o motivo da ligação",
          "Seja cordial e profissional desde o primeiro contato",
          "Pratique a fraseologia de abertura diariamente"
        ],
        resources: [
          "Script de Abordagem Padrão",
          "Treinamento de Comunicação",
          "Simulações de Ligação"
        ]
      },
      confirmacao: {
        title: "Aprimore a Confirmação de Dados",
        tips: [
          "Sempre confirme dados pessoais antes de prosseguir",
          "Use frases como 'Para sua segurança, vou confirmar...'",
          "Peça confirmação de valores e datas importantes",
          "Implemente o protocolo de segurança da informação"
        ],
        resources: [
          "Protocolo de Segurança",
          "Checklist de Confirmação",
          "Treinamento de Segurança"
        ]
      },
      checklist: {
        title: "Domine o Check-list",
        tips: [
          "Siga rigorosamente todos os itens do check-list",
          "Marque cada item conforme for executando",
          "Não pule etapas, mesmo que pareçam desnecessárias",
          "Revise o check-list antes de encerrar a ligação"
        ],
        resources: [
          "Check-list Completo",
          "Treinamento de Processos",
          "Simulações de Check-list"
        ]
      },
      negociacao: {
        title: "Melhore suas Técnicas de Negociação",
        tips: [
          "Identifique as necessidades do cliente primeiro",
          "Apresente benefícios, não apenas características",
          "Use perguntas abertas para entender objeções",
          "Pratique técnicas de fechamento de negócios"
        ],
        resources: [
          "Técnicas de Vendas",
          "Scripts de Negociação",
          "Treinamento de Vendas"
        ]
      },
      falha_critica: {
        title: "Elimine Falhas Críticas",
        tips: [
          "Revise todos os procedimentos críticos",
          "Implemente dupla verificação em processos importantes",
          "Peça ajuda quando tiver dúvidas",
          "Mantenha-se atualizado com as políticas da empresa"
        ],
        resources: [
          "Manual de Procedimentos",
          "Treinamento de Compliance",
          "Suporte Técnico"
        ]
      },
      encerramento: {
        title: "Perfeicione o Encerramento",
        tips: [
          "Use sempre a fraseologia de encerramento correta",
          "Confirme se o cliente tem mais alguma dúvida",
          "Agradeça pela atenção e disponibilidade",
          "Deixe o cliente ciente dos próximos passos"
        ],
        resources: [
          "Script de Encerramento",
          "Treinamento de Comunicação",
          "Simulações de Encerramento"
        ]
      }
    };

    return suggestions[category] || suggestions.abordagem;
  };

  // Função para determinar a cor baseada na taxa de não conformidade
  const getSeverityColor = (rate: number) => {
    if (rate >= 80) return 'text-red-600 bg-red-50 border-red-200';
    if (rate >= 60) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  };

  // Função para determinar o ícone baseado na taxa
  const getSeverityIcon = (rate: number) => {
    if (rate >= 80) return <XCircle className="w-5 h-5 text-red-500" />;
    if (rate >= 60) return <AlertTriangle className="w-5 h-5 text-orange-500" />;
    return <Clock className="w-5 h-5 text-yellow-500" />;
  };

  if (!attentionItems || attentionItems.length === 0) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-6">
        <div className="flex items-center">
          <CheckCircle className="w-6 h-6 text-green-500 mr-3" />
          <div>
            <h3 className="text-lg font-semibold text-green-800">Parabéns!</h3>
            <p className="text-green-600">Não há áreas de atenção no momento. Continue assim!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center mb-4">
        <AlertTriangle className="w-6 h-6 text-red-500 mr-2" />
        <h2 className="text-xl font-bold text-gray-900">Área de Atenção</h2>
        <span className="ml-2 px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
          {attentionItems.length} item{attentionItems.length !== 1 ? 's' : ''}
        </span>
      </div>

      {attentionItems.map((item) => {
        const suggestion = getImprovementSuggestion(item);
        const severityColor = getSeverityColor(item.nonConformityRate);
        const severityIcon = getSeverityIcon(item.nonConformityRate);

        return (
          <div key={item.id} className={`bg-white border-2 ${severityColor} rounded-xl p-6 shadow-sm`}>
            {/* Header do Item */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start">
                {severityIcon}
                <div className="ml-3">
                  <h3 className="text-lg font-semibold text-gray-900">{item.criteria}</h3>
                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-red-600">
                  {item.nonConformityRate.toFixed(1)}%
                </div>
                <div className="text-sm text-gray-500">Taxa de não conformidade</div>
              </div>
            </div>

            {/* Sugestões de Melhoria */}
            <div className="bg-gray-50 rounded-lg p-4 mt-4">
              <div className="flex items-center mb-3">
                <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
                <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
              </div>

              {/* Dicas Práticas */}
              <div className="mb-4">
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Target className="w-4 h-4 mr-1" />
                  Dicas Práticas:
                </h5>
                <ul className="space-y-1">
                  {suggestion.tips.map((tip, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Recursos Disponíveis */}
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <BookOpen className="w-4 h-4 mr-1" />
                  Recursos Disponíveis:
                </h5>
                <div className="flex flex-wrap gap-2">
                  {suggestion.resources.map((resource, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full"
                    >
                      {resource}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Botão de Ação */}
            <div className="mt-4 flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                Ver Detalhes Completos
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AttentionArea; 