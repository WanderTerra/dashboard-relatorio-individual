import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { 
  Star, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar,
  Filter
} from 'lucide-react';
import { getCarteirasNotas } from '../lib/api';

interface CarteiraCard {
  carteira: string;
  nota_media: number;
  total_ligacoes: number;
  aprovacoes: number;
  taxa_aprovacao: number;
  evolucao: number;
  tem_dados: boolean;
}

const DashboardCarteiras: React.FC = () => {
  const { data: carteirasData, isLoading, error } = useQuery({
    queryKey: ['dashboard-carteiras'],
    queryFn: () => getCarteirasNotas(),
  });

  const getNotaColor = (nota: number) => {
    if (nota >= 9) return 'text-green-600';
    if (nota >= 8) return 'text-blue-600';
    if (nota >= 7) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getTaxaColor = (taxa: number) => {
    if (taxa >= 80) return 'text-green-600';
    if (taxa >= 70) return 'text-blue-600';
    if (taxa >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getEvolucaoIcon = (evolucao: number) => {
    if (evolucao > 0) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (evolucao < 0) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getEvolucaoColor = (evolucao: number) => {
    if (evolucao > 0) return 'text-green-600';
    if (evolucao < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  const getEvolucaoText = (evolucao: number) => {
    if (evolucao > 0) return `+${evolucao.toFixed(2)}`;
    if (evolucao < 0) return evolucao.toFixed(2);
    return '-';
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow p-6">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-32 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Erro ao carregar dados das carteiras</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Dashboard de Carteiras
        </h1>
        <p className="text-gray-600">
          Acompanhe o desempenho das carteiras em tempo real
        </p>
      </div>

      {/* Estatísticas Gerais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Star className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Nota Média Geral</p>
              <p className="text-2xl font-bold text-gray-900">
                {carteirasData?.nota_media_geral?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Taxa de Aprovação</p>
              <p className="text-2xl font-bold text-gray-900">
                {carteirasData?.taxa_aprovacao_geral?.toFixed(1) || '0.0'}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total de Ligações</p>
              <p className="text-2xl font-bold text-gray-900">
                {carteirasData?.total_ligacoes?.toLocaleString() || '0'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Filter className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Carteiras Ativas</p>
              <p className="text-2xl font-bold text-gray-900">
                {carteirasData?.carteiras?.filter(c => c.tem_dados).length || '0'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cards das Carteiras */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {carteirasData?.carteiras?.map((carteira) => (
          <div key={carteira.carteira} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
            <div className="p-6">
              {/* Header do Card */}
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-1">
                  {carteira.carteira}
                </h3>
                <p className="text-sm text-gray-600">
                  {carteira.total_ligacoes} ligações avaliadas
                </p>
              </div>

              {/* Conteúdo Principal */}
              {carteira.tem_dados ? (
                <>
                  {/* Gráfico Circular Simples */}
                  <div className="flex items-center justify-center mb-6">
                    <div className="relative w-32 h-32">
                      <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className={carteira.taxa_aprovacao >= 80 ? 'text-green-500' : 
                                   carteira.taxa_aprovacao >= 70 ? 'text-blue-500' : 
                                   carteira.taxa_aprovacao >= 60 ? 'text-yellow-500' : 'text-red-500'}
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                          fill="none"
                          strokeDasharray={`${carteira.taxa_aprovacao}, 100`}
                          d="M18 2.0845
                            a 15.9155 15.9155 0 0 1 0 31.831
                            a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className={`text-2xl font-bold ${getTaxaColor(carteira.taxa_aprovacao)}`}>
                            {carteira.taxa_aprovacao.toFixed(1)}%
                          </div>
                          <div className="text-xs text-gray-600">Aprovação</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Métricas */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-4 h-4 text-yellow-500 mr-2" />
                        <span className="text-sm text-gray-600">NOTA MÉDIA</span>
                      </div>
                      <span className={`text-lg font-bold ${getNotaColor(carteira.nota_media)}`}>
                        {carteira.nota_media.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {getEvolucaoIcon(carteira.evolucao)}
                        <span className="text-sm text-gray-600 ml-2">EVOLUÇÃO</span>
                      </div>
                      <span className={`text-sm font-medium ${getEvolucaoColor(carteira.evolucao)}`}>
                        {getEvolucaoText(carteira.evolucao)}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-gray-400 mb-4">
                    <Star className="w-12 h-12 mx-auto" />
                  </div>
                  <p className="text-gray-500 text-sm mb-2">
                    Sem avaliações no período atual
                  </p>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-400">
                    <div className="flex items-center">
                      <Star className="w-4 h-4 mr-1" />
                      <span>0</span>
                    </div>
                    <div className="flex items-center">
                      <Minus className="w-4 h-4 mr-1" />
                      <span>-</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Mensagem quando não há dados */}
      {(!carteirasData?.carteiras || carteirasData.carteiras.length === 0) && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Star className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhuma carteira encontrada
          </h3>
          <p className="text-gray-600">
            Não há dados de avaliação disponíveis no momento.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardCarteiras;
