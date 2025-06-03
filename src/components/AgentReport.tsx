import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Phone, Clock, User, BarChart2 } from 'lucide-react';
import { 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  Radar, 
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import { formatItemName } from '../lib/format';

const AgentReport = () => {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  
  // Dados simulados para o relatório individual
  const agentData = {
    id: parseInt(agentId || '1'),
    name: 'Carlos Silva',
    callTime: '2025-05-19T14:30:00',
    callDuration: '12:45',
    finalScore: 45,
    criteria: [
      { 
        id: 'abordagem_atendeu', 
        name: '1. Abordagem', 
        description: 'Atendeu prontamente?', 
        value: 30, 
        status: 'nao_conforme' as const,
        conditional: false
      },
      { 
        id: 'seguranca_info_corretas', 
        name: '2. Segurança', 
        description: 'Atendimento seguro, sem informações falsas?', 
        value: 40, 
        status: 'nao_conforme' as const,
        conditional: false
      },
      { 
        id: 'fraseologia_explica_motivo', 
        name: '3. Fraseologia', 
        description: 'Explicou motivo de ausência/transferência?', 
        value: 60, 
        status: 'conforme' as const,
        conditional: false
      },
      { 
        id: 'comunicacao_tom_adequado', 
        name: '4. Comunicação', 
        description: 'Tom de voz adequado, linguagem clara, sem gírias?', 
        value: 50, 
        status: 'nao_conforme' as const,
        conditional: false
      },
      { 
        id: 'cordialidade_respeito', 
        name: '5. Cordialidade', 
        description: 'Respeitoso, sem comentários impróprios?', 
        value: 70, 
        status: 'conforme' as const,
        conditional: false
      },
      { 
        id: 'empatia_genuina', 
        name: '6. Empatia', 
        description: 'Demonstrou empatia genuína?', 
        value: 40, 
        status: 'nao_conforme' as const,
        conditional: false
      },
      { 
        id: 'escuta_sem_interromper', 
        name: '7. Escuta Ativa', 
        description: 'Ouviu sem interromper, retomando pontos?', 
        value: 30, 
        status: 'nao_conforme' as const,
        conditional: false
      },
      { 
        id: 'clareza_direta', 
        name: '8. Clareza & Objetividade', 
        description: 'Explicações diretas, sem rodeios?', 
        value: 60, 
        status: 'conforme' as const,
        conditional: false
      },
      { 
        id: 'oferta_valores_corretos', 
        name: '9. Oferta de Solução', 
        description: 'Apresentou valores, descontos e opções corretamente?', 
        value: 20, 
        status: 'nao_conforme' as const,
        conditional: true,
        conditionalText: 'Aplica-se só se cliente permitir'
      },
      { 
        id: 'confirmacao_aceite', 
        name: '10. Confirmação de Aceite', 
        description: 'Confirmou negociação com "sim, aceito/confirmo"?', 
        value: 0, 
        status: 'nao_aplicavel' as const,
        conditional: true,
        conditionalText: 'Aplica-se só se houve negociação'
      },
      { 
        id: 'reforco_prazo', 
        name: '11. Reforço de Prazo', 
        description: 'Reforçou data-limite e perda de desconto?', 
        value: 0, 
        status: 'nao_aplicavel' as const,
        conditional: true,
        conditionalText: 'Aplica-se só se fechou acordo'
      },
      { 
        id: 'encerramento_agradece', 
        name: '12. Encerramento', 
        description: 'Perguntou "Posso ajudar em algo mais?" e agradeceu?', 
        value: 0, 
        status: 'nao_aplicavel' as const,
        conditional: true,
        conditionalText: 'Aplica-se só se fechou acordo'
      }
    ]
  };

  // Formatar dados para o gráfico de radar
  const radarData = agentData.criteria
    .filter(criterion => criterion.status !== 'nao_aplicavel')
    .map(criterion => ({
      subject: criterion.name.split('.')[1].trim(),
      A: criterion.value,
      fullMark: 100
    }));

  // Formatar data e hora
  const formatDateTime = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obter status visual
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'conforme':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            {formatItemName(status)}
          </span>
        );
      case 'nao_conforme':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            {formatItemName(status)}
          </span>
        );
      case 'nao_aplicavel':
        return (
          <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {formatItemName(status)}
          </span>
        );
      default:
        return null;
    }
  };

  // Obter cor do score
  const getScoreColor = (score: number) => {
    if (score < 60) return 'text-red-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Cabeçalho */}
      <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center">
            <button 
              onClick={() => navigate('/')}
              className="mr-4 p-2 rounded-full bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Relatório Individual de Avaliação</h1>
              <p className="text-blue-100 mt-1">Detalhes de desempenho e pontos de melhoria</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Informações do agente e ligação */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <User className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Agente</h3>
                <p className="text-lg font-semibold">{agentData.name}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <Clock className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Data e Hora</h3>
                <p className="text-lg font-semibold">{formatDateTime(agentData.callTime)}</p>
              </div>
            </div>
            
            <div className="flex items-center">
              <div className="flex-shrink-0 h-12 w-12 bg-indigo-100 rounded-full flex items-center justify-center mr-4">
                <Phone className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500">Duração</h3>
                <p className="text-lg font-semibold">{agentData.callDuration}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Gráfico e Nota Final */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Gráfico de desempenho */}
          <div className="md:col-span-2 bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center mb-4">
              <BarChart2 className="h-6 w-6 text-indigo-700 mr-2" />
              <h2 className="text-xl font-semibold">Desempenho da Ligação</h2>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} />
                  <Radar
                    name="Pontuação"
                    dataKey="A"
                    stroke="#4f46e5"
                    fill="#4f46e5"
                    fillOpacity={0.6}
                  />
                  <Tooltip formatter={(value) => [`${value}%`, 'Pontuação']} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Nota Final */}
          <div className="bg-white rounded-lg shadow-md p-6 flex flex-col justify-center items-center">
            <h2 className="text-xl font-semibold mb-4">Nota Final</h2>
            <div className={`text-6xl font-bold ${getScoreColor(agentData.finalScore)}`}>
              {agentData.finalScore}
            </div>
            <div className="text-2xl font-medium text-gray-500 mt-2">pontos</div>
            
            <div className="w-full bg-gray-200 rounded-full h-4 mt-6">
              <div 
                className={`h-4 rounded-full ${
                  agentData.finalScore < 60 ? 'bg-red-600' : 
                  agentData.finalScore < 70 ? 'bg-yellow-500' : 'bg-green-600'
                }`} 
                style={{ width: `${agentData.finalScore}%` }}
              ></div>
            </div>
            
            <div className="mt-4 text-center">
              <span className={`text-lg font-medium ${getScoreColor(agentData.finalScore)}`}>
                {agentData.finalScore < 60 ? 'Não Conforme' : 
                 agentData.finalScore < 70 ? 'Atenção' : 'Conforme'}
              </span>
            </div>
          </div>
        </div>

        {/* Critérios de Avaliação */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">Critérios de Avaliação</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {agentData.criteria.map((criterion) => (
              <div 
                key={criterion.id} 
                className={`p-4 rounded-lg border ${
                  criterion.status === 'nao_conforme' ? 'border-red-200 bg-red-50' : 
                  criterion.status === 'conforme' ? 'border-green-200 bg-green-50' : 
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">{criterion.name}</h3>
                  {getStatusBadge(criterion.status)}
                </div>
                <p className="text-gray-600 mt-2">{criterion.description}</p>
                
                {criterion.status !== 'nao_aplicavel' && (
                  <div className="mt-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span>Pontuação</span>
                      <span className="font-medium">{criterion.value}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          criterion.value < 60 ? 'bg-red-600' : 
                          criterion.value < 70 ? 'bg-yellow-500' : 'bg-green-600'
                        }`} 
                        style={{ width: `${criterion.value}%` }}
                      ></div>
                    </div>
                  </div>
                )}
                
                {criterion.conditional && (
                  <div className="mt-2 text-sm text-gray-500 italic">
                    {criterion.conditionalText}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Pontos de Melhoria */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-6">
          <h2 className="text-xl font-semibold mb-4">
            <span className="text-red-600 mr-2">⚠️</span> 
            Pontos de Melhoria
          </h2>
          
          <div className="space-y-4">
            {agentData.criteria
              .filter(criterion => criterion.status === 'nao_conforme')
              .map((criterion) => (
                <div key={`improvement-${criterion.id}`} className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <h3 className="font-medium text-red-800">{criterion.name}</h3>
                  <p className="text-gray-700 mt-1">{criterion.description}</p>
                  <div className="mt-2 text-sm text-gray-600">
                    <span className="font-medium">Sugestão de melhoria:</span> Revisar procedimentos de {formatItemName(criterion.id)} e praticar com exemplos.
                  </div>
                </div>
              ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default AgentReport;
