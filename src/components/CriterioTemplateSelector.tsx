import React, { useState } from 'react';
import { BookOpen, Plus, X, CheckCircle, Target, ArrowRight } from 'lucide-react';
import { api, adicionarCriterioNaCarteira } from '../lib/api';
import { useToast } from '../hooks/use-toast';

interface CriterioTemplateSelectorProps {
  carteiraId: number;
  carteiraNome: string;
  onCriterioCreated: (criterio: any) => void;
  onCancel: () => void;
}

interface TemplateCriterio {
  nome: string;
  descricao: string;
  exemplo_frase?: string;
  categoria: string;
  peso: number;
}

// Templates pré-definidos de critérios
const TEMPLATES = {
  'atendimento_geral': {
    nome: 'Atendimento Geral',
    criterios: [
      {
        nome: 'Saudação Inicial',
        descricao: 'Agente deve cumprimentar o cliente de forma cordial',
        exemplo_frase: 'Bom dia, como posso ajudá-lo?',
        categoria: 'Saudação',
        peso: 1.0
      },
      {
        nome: 'Identificação do Cliente',
        descricao: 'Agente deve confirmar os dados do cliente',
        exemplo_frase: 'Posso confirmar seu nome e CPF?',
        categoria: 'Identificação',
        peso: 1.5
      },
      {
        nome: 'Escuta Ativa',
        descricao: 'Agente deve demonstrar que está ouvindo o cliente',
        exemplo_frase: 'Entendo sua situação...',
        categoria: 'Comunicação',
        peso: 1.0
      },
      {
        nome: 'Resolução do Problema',
        descricao: 'Agente deve resolver a questão do cliente',
        exemplo_frase: 'Vou resolver isso para você agora',
        categoria: 'Resolução',
        peso: 2.0
      },
      {
        nome: 'Despedida Cordial',
        descricao: 'Agente deve se despedir de forma educada',
        exemplo_frase: 'Obrigado por entrar em contato, tenha um bom dia!',
        categoria: 'Encerramento',
        peso: 0.5
      }
    ]
  },
  'vendas': {
    nome: 'Vendas e Prospecção',
    criterios: [
      {
        nome: 'Qualificação da Oportunidade',
        descricao: 'Agente deve identificar se o cliente tem potencial de compra',
        exemplo_frase: 'Você tem interesse em nossos produtos?',
        categoria: 'Qualificação',
        peso: 1.5
      },
      {
        nome: 'Apresentação de Benefícios',
        descricao: 'Agente deve destacar os benefícios do produto/serviço',
        exemplo_frase: 'Este produto vai economizar seu tempo e dinheiro',
        categoria: 'Vendas',
        peso: 2.0
      },
      {
        nome: 'Tratamento de Objeções',
        descricao: 'Agente deve lidar com objeções de forma profissional',
        exemplo_frase: 'Entendo sua preocupação, mas posso explicar melhor',
        categoria: 'Vendas',
        peso: 1.5
      },
      {
        nome: 'Fechamento da Venda',
        descricao: 'Agente deve tentar fechar a venda de forma natural',
        exemplo_frase: 'Posso fazer o pedido para você agora?',
        categoria: 'Vendas',
        peso: 2.0
      }
    ]
  },
  'suporte_tecnico': {
    nome: 'Suporte Técnico',
    criterios: [
      {
        nome: 'Diagnóstico do Problema',
        descricao: 'Agente deve identificar corretamente o problema técnico',
        exemplo_frase: 'Pode me descrever o que está acontecendo?',
        categoria: 'Diagnóstico',
        peso: 2.0
      },
      {
        nome: 'Instruções Claras',
        descricao: 'Agente deve dar instruções de forma clara e compreensível',
        exemplo_frase: 'Vamos fazer isso passo a passo...',
        categoria: 'Instruções',
        peso: 1.5
      },
      {
        nome: 'Verificação da Solução',
        descricao: 'Agente deve confirmar se o problema foi resolvido',
        exemplo_frase: 'O problema foi resolvido? Pode testar agora?',
        categoria: 'Verificação',
        peso: 1.0
      },
      {
        nome: 'Documentação do Atendimento',
        descricao: 'Agente deve registrar adequadamente o atendimento',
        exemplo_frase: 'Vou registrar essas informações no sistema',
        categoria: 'Documentação',
        peso: 1.0
      }
    ]
  },
  'cobranca': {
    nome: 'Cobrança',
    criterios: [
      {
        nome: 'Confirmação da Dívida',
        descricao: 'Agente deve confirmar os valores e prazos da dívida',
        exemplo_frase: 'Posso confirmar o valor em aberto?',
        categoria: 'Confirmação',
        peso: 1.5
      },
      {
        nome: 'Negociação de Pagamento',
        descricao: 'Agente deve negociar formas de pagamento adequadas',
        exemplo_frase: 'Posso oferecer algumas opções de pagamento',
        categoria: 'Negociação',
        peso: 2.0
      },
      {
        nome: 'Tratamento de Dificuldades',
        descricao: 'Agente deve ser empático com dificuldades financeiras',
        exemplo_frase: 'Entendo sua situação, vamos encontrar uma solução',
        categoria: 'Empatia',
        peso: 1.0
      },
      {
        nome: 'Acordo de Pagamento',
        descricao: 'Agente deve formalizar o acordo de pagamento',
        exemplo_frase: 'Vou registrar o acordo no sistema',
        categoria: 'Acordo',
        peso: 1.5
      }
    ]
  }
};

const CriterioTemplateSelector: React.FC<CriterioTemplateSelectorProps> = ({
  carteiraId,
  carteiraNome,
  onCriterioCreated,
  onCancel
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedCriterios, setSelectedCriterios] = useState<TemplateCriterio[]>([]);
  const [loading, setLoading] = useState(false);

  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setSelectedCriterios(TEMPLATES[templateKey as keyof typeof TEMPLATES].criterios);
  };

  const handleCriterioToggle = (criterio: TemplateCriterio) => {
    setSelectedCriterios(prev => {
      const isSelected = prev.some(c => c.nome === criterio.nome);
      if (isSelected) {
        return prev.filter(c => c.nome !== criterio.nome);
      } else {
        return [...prev, criterio];
      }
    });
  };

  const handleApplyTemplate = async () => {
    if (selectedCriterios.length === 0) {
      toast({
        title: "⚠️ Nenhum critério selecionado",
        description: "Selecione pelo menos um critério para aplicar.",
        duration: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      const createdCriterios = [];

      for (const criterio of selectedCriterios) {
        // Criar critério
        const criterioResponse = await api.post("/criterios/", {
          ...criterio,
          ativo: true
        });
        
        const novoCriterio = criterioResponse.data;
        createdCriterios.push(novoCriterio);

        // Associar à carteira
        await adicionarCriterioNaCarteira({
          carteira_id: carteiraId,
          criterio_id: novoCriterio.id,
          ordem: 1,
          peso_especifico: criterio.peso
        });
      }

      toast({
        title: "✅ Template aplicado com sucesso!",
        description: `${selectedCriterios.length} critério(s) foram adicionados à carteira "${carteiraNome}".`,
        duration: 3000,
      });

      // Chamar callback para cada critério criado
      createdCriterios.forEach(criterio => {
        console.log('📞 Chamando onCriterioCreated para:', criterio);
        onCriterioCreated({
          ...criterio,
          carteira_id: carteiraId
        });
      });

    } catch (error) {
      console.error('Erro ao aplicar template:', error);
      toast({
        title: "❌ Erro ao aplicar template",
        description: "Verifique a conexão e tente novamente.",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <BookOpen className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Selecionar Template de Critérios</h2>
              <p className="text-sm text-gray-600">Para a carteira: <strong>{carteiraNome}</strong></p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Seleção de Template */}
        <div className="mb-6">
          <h3 className="text-md font-semibold text-gray-900 mb-4">Escolha um template:</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                onClick={() => handleTemplateSelect(key)}
                className={`p-4 border-2 rounded-xl text-left transition-all duration-200 ${
                  selectedTemplate === key
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    selectedTemplate === key ? 'bg-green-100' : 'bg-gray-100'
                  }`}>
                    <BookOpen className={`h-4 w-4 ${
                      selectedTemplate === key ? 'text-green-600' : 'text-gray-600'
                    }`} />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900">{template.nome}</h4>
                    <p className="text-sm text-gray-600">{template.criterios.length} critérios</p>
                  </div>
                  {selectedTemplate === key && (
                    <CheckCircle className="h-5 w-5 text-green-600 ml-auto" />
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lista de Critérios do Template */}
        {selectedTemplate && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-semibold text-gray-900">
                Critérios do template "{TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].nome}"
              </h3>
              <span className="text-sm text-gray-600">
                {selectedCriterios.length} de {TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].criterios.length} selecionados
              </span>
            </div>
            
            <div className="space-y-3">
              {TEMPLATES[selectedTemplate as keyof typeof TEMPLATES].criterios.map((criterio, index) => {
                const isSelected = selectedCriterios.some(c => c.nome === criterio.nome);
                return (
                  <div
                    key={index}
                    onClick={() => handleCriterioToggle(criterio)}
                    className={`p-4 border rounded-lg cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-lg mt-1 ${
                        isSelected ? 'bg-green-100' : 'bg-gray-100'
                      }`}>
                        <Target className={`h-4 w-4 ${
                          isSelected ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-gray-900">{criterio.nome}</h4>
                          {isSelected && <CheckCircle className="h-4 w-4 text-green-600" />}
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{criterio.descricao}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <span>Categoria: {criterio.categoria}</span>
                          <span>Peso: {criterio.peso}</span>
                          {criterio.exemplo_frase && (
                            <span className="italic">"{criterio.exemplo_frase}"</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
          >
            Cancelar
          </button>
          <button
            onClick={handleApplyTemplate}
            disabled={loading || selectedCriterios.length === 0}
            className="inline-flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Aplicando...
              </>
            ) : (
              <>
                <ArrowRight className="h-4 w-4" />
                Aplicar Template ({selectedCriterios.length} critérios)
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export { CriterioTemplateSelector }; 