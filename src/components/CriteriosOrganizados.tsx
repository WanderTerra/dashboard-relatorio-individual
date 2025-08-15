import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ChevronDown, ChevronRight, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface CriterioCarteira {
  id: number;
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
}

interface Criterio {
  id: number;
  nome: string;
  categoria: string;
  descricao?: string;
  peso: number;
  ativo: boolean;
}

interface CriteriosOrganizadosProps {
  criteriosCarteira: CriterioCarteira[] | undefined;
  todosCriterios: Criterio[] | undefined;
  isLoading: boolean;
}

const CriteriosOrganizados: React.FC<CriteriosOrganizadosProps> = ({
  criteriosCarteira,
  todosCriterios,
  isLoading
}) => {
  // TODOS OS HOOKS DEVEM VIR PRIMEIRO - antes de qualquer lógica condicional
  const [categoriasExpandidas, setCategoriasExpandidas] = React.useState<Set<string>>(new Set());

  // Organizar critérios por categoria e ordem - sempre executar
  const criteriosOrganizados = React.useMemo(() => {
    // Se não há dados, retornar array vazio
    if (!criteriosCarteira || !todosCriterios || criteriosCarteira.length === 0) {
      return [];
    }

    // Criar um mapa dos critérios por ID para acesso rápido
    const criteriosMap = new Map(todosCriterios.map(c => [c.id, c]));
    
    // Filtrar e ordenar critérios da carteira
    const criteriosFiltrados = criteriosCarteira
      .filter(cc => criteriosMap.has(cc.criterio_id))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
      .map(cc => ({
        ...cc,
        criterio: criteriosMap.get(cc.criterio_id)!
      }));

    // Agrupar por categoria
    const categorias = new Map<string, typeof criteriosFiltrados>();
    
    criteriosFiltrados.forEach(item => {
      const categoria = item.criterio.categoria || 'Sem Categoria';
      if (!categorias.has(categoria)) {
        categorias.set(categoria, []);
      }
      categorias.get(categoria)!.push(item);
    });

    // Ordenar categorias (abordagem primeiro, valores segundo, etc.)
    const ordemCategorias = [
      'Abordagem',
      'Valores', 
      'Técnica',
      'Comunicação',
      'Resolução',
      'Documentação',
      'Sem Categoria'
    ];

    const categoriasOrdenadas = Array.from(categorias.entries()).sort((a, b) => {
      const indexA = ordemCategorias.indexOf(a[0]);
      const indexB = ordemCategorias.indexOf(b[0]);
      
      // Se ambas estão na lista de ordem, usar a ordem definida
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Se apenas uma está na lista, ela vem primeiro
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
      
      // Se nenhuma está na lista, ordenar alfabeticamente
      return a[0].localeCompare(b[0]);
    });

    return categoriasOrdenadas;
  }, [criteriosCarteira, todosCriterios]);

  // Funções de controle - sempre definidas
  const toggleCategoria = React.useCallback((categoria: string) => {
    setCategoriasExpandidas(prev => {
      const novo = new Set(prev);
      if (novo.has(categoria)) {
        novo.delete(categoria);
      } else {
        novo.add(categoria);
      }
      return novo;
    });
  }, []);

  const expandirTodas = React.useCallback(() => {
    setCategoriasExpandidas(new Set(criteriosOrganizados.map(([categoria]) => categoria)));
  }, [criteriosOrganizados]);

  const colapsarTodas = React.useCallback(() => {
    setCategoriasExpandidas(new Set());
  }, []);

  // Renderização condicional - APÓS todos os hooks
  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="flex items-center justify-center gap-4">
            <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <span className="text-gray-600">Carregando critérios da carteira...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!criteriosCarteira || !todosCriterios || criteriosCarteira.length === 0) {
    return (
      <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
        <CardContent className="pt-8 pb-8">
          <div className="text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>Nenhum critério configurado para esta carteira</p>
            <p className="text-sm">Configure os critérios na seção de Carteiras</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-xl">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-gray-800">Critérios da Carteira</CardTitle>
              <p className="text-gray-600 text-sm">
                Organizados por categoria e ordem de aplicação
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={expandirTodas}
              className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded-full hover:bg-blue-200 transition-colors"
            >
              Expandir Todas
            </button>
            <button
              onClick={colapsarTodas}
              className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors"
            >
              Colapsar Todas
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {criteriosOrganizados.map(([categoria, criterios], categoriaIndex) => (
            <div key={categoria} className="border border-gray-200 rounded-lg overflow-hidden">
              {/* Header da Categoria */}
              <button
                onClick={() => toggleCategoria(categoria)}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 transition-all duration-200"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {categoriaIndex + 1}
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-800 text-lg capitalize">
                      {categoria.toLowerCase()}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {criterios.length} critério{criterios.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                    {criterios.length}
                  </Badge>
                  {categoriasExpandidas.has(categoria) ? (
                    <ChevronDown className="w-5 h-5 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" />
                  )}
                </div>
              </button>

              {/* Lista de Critérios */}
              {categoriasExpandidas.has(categoria) && (
                <div className="bg-white border-t border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {criterios.map((item, criterioIndex) => (
                      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Número de Ordem */}
                          <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                            {item.ordem || criterioIndex + 1}
                          </div>
                          
                          {/* Conteúdo do Critério */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900 mb-1">
                                  {item.criterio.nome}
                                </h4>
                                {item.criterio.descricao && (
                                  <p className="text-sm text-gray-600 mb-2">
                                    {item.criterio.descricao}
                                  </p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  <span>Peso: {item.peso_especifico || item.criterio.peso}</span>
                                  <span>•</span>
                                  <span>ID: {item.criterio.id}</span>
                                </div>
                              </div>
                              
                              {/* Status do Critério */}
                              <div className="flex items-center gap-2">
                                <Badge 
                                  variant={item.criterio.ativo ? "default" : "secondary"}
                                  className={item.criterio.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}
                                >
                                  {item.criterio.ativo ? (
                                    <>
                                      <CheckCircle className="w-3 h-3 mr-1" />
                                      Ativo
                                    </>
                                  ) : (
                                    <>
                                      <XCircle className="w-3 h-3 mr-1" />
                                      Inativo
                                    </>
                                  )}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Resumo */}
        <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-800">
              <FileText className="w-4 h-4" />
              <span className="font-medium">Resumo da Carteira</span>
            </div>
            <div className="text-sm text-blue-700">
              Total: {criteriosOrganizados.reduce((acc, [, criterios]) => acc + criterios.length, 0)} critérios
            </div>
          </div>
          <div className="mt-2 text-xs text-blue-600">
            Os critérios são aplicados na ordem especificada para garantir uma avaliação consistente
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CriteriosOrganizados; 