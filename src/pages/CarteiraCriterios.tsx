import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Edit, Trash2, Target, Folder, Link2, ChevronDown, ChevronRight, BookOpen } from "lucide-react";
import PageHeader from "../components/PageHeader";
import { AddExistingCriterioModal } from "../components/AddExistingCriterioModal";
import { useToast } from "../hooks/use-toast";

interface Carteira {
  id: number;
  nome: string;
  descricao?: string;
  ativo: boolean;
}

interface Criterio {
  id: number;
  nome: string;
  descricao?: string;
  exemplo_frase?: string;
  categoria?: string;
  peso?: number;
}

interface CarteiraCriterio {
  id: number;
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
  criterio?: Criterio;
}

const CarteiraCriterios: React.FC = () => {
  const { toast } = useToast();
  
  // Estados principais
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [associacoes, setAssociacoes] = useState<CarteiraCriterio[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedCarteira, setExpandedCarteira] = useState<number | null>(null);

  // Estados dos modais
  const [showCarteiraModal, setShowCarteiraModal] = useState(false);
  const [showCriterioModal, setShowCriterioModal] = useState(false);
  const [editCarteira, setEditCarteira] = useState<Carteira | null>(null);
  const [editCriterio, setEditCriterio] = useState<Criterio | null>(null);
  const [selectedCarteiraForCriterio, setSelectedCarteiraForCriterio] = useState<Carteira | null>(null);
  const [showAddExistingModal, setShowAddExistingModal] = useState(false);

  // Estados dos formulários
  const [carteiraForm, setCarteiraForm] = useState({ nome: "", descricao: "", ativo: true });
  const [criterioForm, setCriterioForm] = useState({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1 });

  // Carregar dados iniciais
  useEffect(() => {
    fetchCarteiras();
    fetchCriterios();
  }, []);

  // Carregar associações quando uma carteira é expandida
  useEffect(() => {
    if (expandedCarteira) {
      fetchAssociacoes(expandedCarteira);
    }
  }, [expandedCarteira]);

  const fetchCarteiras = async () => {
    setLoading(true);
    try {
      const res = await api.get("/carteiras/");
      setCarteiras(res.data);
    } catch (err) {
      console.error("Erro ao carregar carteiras:", err);
    }
    setLoading(false);
  };

  const fetchCriterios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/criterios/");
      setCriterios(res.data);
    } catch (err) {
      console.error("Erro ao carregar critérios:", err);
    }
    setLoading(false);
  };

  const fetchAssociacoes = async (carteiraId: number) => {
    try {
      const res = await api.get(`/carteira_criterios/carteira/${carteiraId}`);
      setAssociacoes(res.data);
    } catch (err) {
      console.error("Erro ao carregar associações:", err);
    }
  };

  // CRUD Carteira
  const handleCarteiraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCarteira) {
        await api.put(`/carteiras/${editCarteira.id}`, carteiraForm);
      } else {
        await api.post("/carteiras/", carteiraForm);
      }
      await fetchCarteiras();
      setShowCarteiraModal(false);
      setEditCarteira(null);
      setCarteiraForm({ nome: "", descricao: "", ativo: true });
    } catch (err) {
      console.error("Erro ao salvar carteira:", err);
    }
    setLoading(false);
  };

  const handleCarteiraDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir esta carteira?")) return;
    setLoading(true);
    try {
      await api.delete(`/carteiras/${id}`);
      await fetchCarteiras();
      if (expandedCarteira === id) {
        setExpandedCarteira(null);
      }
    } catch (err) {
      console.error("Erro ao excluir carteira:", err);
    }
    setLoading(false);
  };

  // CRUD Critério
  const handleCriterioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCriterio) {
        await api.put(`/criterios/${editCriterio.id}`, criterioForm);
        await fetchCriterios();
      } else {
        // Criar critério e associar automaticamente à carteira
        const criterioResponse = await api.post("/criterios/", criterioForm);
        const novoCriterio = criterioResponse.data;
        
        // Adicionar à lista local
        setCriterios(prev => [...prev, novoCriterio]);
        
        // Associar automaticamente à carteira se houver uma selecionada
        if (selectedCarteiraForCriterio) {
          try {
            const associacaoResponse = await api.post('/carteira_criterios/', {
              carteira_id: selectedCarteiraForCriterio.id,
              criterio_id: novoCriterio.id,
              ordem: 1,
              peso_especifico: criterioForm.peso
            });
            
            // Adicionar associação à lista local
            const novaAssociacao = {
              id: associacaoResponse.data.id || Date.now(),
              carteira_id: selectedCarteiraForCriterio.id,
              criterio_id: novoCriterio.id,
              criterio: novoCriterio,
              ordem: 1,
              peso_especifico: criterioForm.peso
            } as CarteiraCriterio;
            
            setAssociacoes(prev => [...prev, novaAssociacao]);
            
            // Mostrar feedback
            toast({
              title: "✅ Critério criado com sucesso!",
              description: `"${novoCriterio.nome}" foi adicionado à carteira "${selectedCarteiraForCriterio.nome}".`,
              duration: 3000,
            });
          } catch (error) {
            console.error('Erro ao associar critério:', error);
            toast({
              title: "⚠️ Critério criado, mas erro na associação",
              description: "O critério foi criado, mas não foi associado à carteira. Tente associar manualmente.",
              duration: 5000,
            });
          }
        } else {
          toast({
            title: "✅ Critério criado com sucesso!",
            description: `"${novoCriterio.nome}" foi criado. Associe-o a uma carteira manualmente.`,
            duration: 3000,
          });
        }
      }
      
      setShowCriterioModal(false);
      setEditCriterio(null);
      setSelectedCarteiraForCriterio(null);
      setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1 });
      
    } catch (err) {
      console.error("Erro ao salvar critério:", err);
      toast({
        title: "❌ Erro ao criar critério",
        description: "Verifique os dados e tente novamente.",
        duration: 3000,
      });
    }
    setLoading(false);
  };

  const handleCriterioDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este critério?")) return;
    setLoading(true);
    try {
      await api.delete(`/criterios/${id}`);
      await fetchCriterios();
      if (expandedCarteira) {
        await fetchAssociacoes(expandedCarteira);
      }
    } catch (err) {
      console.error("Erro ao excluir critério:", err);
    }
    setLoading(false);
  };

  // Associações
  const handleAssociar = async (criterioId: number) => {
    if (!expandedCarteira) return;
    try {
      await api.post('/carteira_criterios/', {
        carteira_id: expandedCarteira,
        criterio_id: criterioId
      });
      await fetchAssociacoes(expandedCarteira);
    } catch (err) {
      console.error("Erro ao associar critério:", err);
    }
  };

  const handleDesassociar = async (associacaoId: number) => {
    try {
      await api.delete(`/carteira_criterios/${associacaoId}`);
      if (expandedCarteira) {
        await fetchAssociacoes(expandedCarteira);
      }
    } catch (err) {
      console.error("Erro ao remover associação:", err);
    }
  };

  // Funções auxiliares
  const getCriteriosDaCarteira = (carteiraId: number) => {
    const associacoesDaCarteira = associacoes.filter(a => a.carteira_id === carteiraId);
    const criterioIds = associacoesDaCarteira.map(a => a.criterio_id);
    return criterios.filter(c => criterioIds.includes(c.id));
  };

  const getCriteriosDisponiveis = (carteiraId: number) => {
    const associacoesDaCarteira = associacoes.filter(a => a.carteira_id === carteiraId);
    const criterioIds = associacoesDaCarteira.map(a => a.criterio_id);
    return criterios.filter(c => !criterioIds.includes(c.id));
  };

  const handleToggleCarteira = (carteiraId: number) => {
    if (expandedCarteira === carteiraId) {
      setExpandedCarteira(null);
    } else {
      setExpandedCarteira(carteiraId);
    }
  };

  const handleCriterioCreated = (criterio: any) => {
    setCriterios(prev => prev.some(x => x.id === criterio.id) ? prev : [...prev, criterio]);
    const novaAssociacao: CarteiraCriterio = {
      id: Date.now(),
      carteira_id: criterio.carteira_id,
      criterio_id: criterio.id,
      criterio: criterio,
      ordem: 1,
      peso_especifico: criterio.peso
    };
    setAssociacoes(prev => [...prev, novaAssociacao]);
    setSelectedCarteiraForCriterio(null);
    toast({
      title: "✅ Critério criado com sucesso!",
      description: `"${criterio.nome}" foi adicionado à carteira.`,
      duration: 3000,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Carteiras & Critérios" 
        subtitle="Gerencie carteiras e seus critérios de avaliação"
        actions={
          <div className="flex gap-3">
            <button 
              onClick={() => {
                setEditCarteira(null);
                setCarteiraForm({ nome: "", descricao: "", ativo: true });
                setShowCarteiraModal(true);
              }} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium"
            >
              <Plus className="h-4 w-4" />
              Nova Carteira
            </button>
          </div>
        }
      />
      
      <div className="p-6 space-y-6">
        {/* Cards de estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Carteiras</p>
                <p className="text-2xl font-bold text-gray-900">{carteiras.length}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <Folder className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Critérios</p>
                <p className="text-2xl font-bold text-gray-900">{criterios.length}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Associações Ativas</p>
                <p className="text-2xl font-bold text-gray-900">{associacoes.length}</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-xl">
                <Link2 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Lista de Carteiras com Cards Expansíveis */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              <span className="ml-3 text-gray-600">Carregando carteiras...</span>
            </div>
          ) : carteiras.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow-lg border border-gray-100">
              <Folder className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">Nenhuma carteira criada</h3>
              <p className="text-gray-600 mb-6">Crie sua primeira carteira para começar a gerenciar critérios</p>
              <button 
                onClick={() => {
                  setEditCarteira(null);
                  setCarteiraForm({ nome: "", descricao: "", ativo: true });
                  setShowCarteiraModal(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium"
              >
                <Plus className="h-5 w-5" />
                Criar Primeira Carteira
              </button>
            </div>
          ) : (
            carteiras.map(carteira => (
              <div key={carteira.id} className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                {/* Header da Carteira */}
                <div 
                  className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                  onClick={() => handleToggleCarteira(carteira.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-blue-100 rounded-xl">
                        <Folder className="h-6 w-6 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{carteira.nome}</h3>
                        <p className="text-sm text-gray-600">{carteira.descricao || "Sem descrição"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                        carteira.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {carteira.ativo ? "Ativo" : "Inativo"}
                      </span>
                      {expandedCarteira === carteira.id ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                    </div>
                  </div>
                </div>

                {/* Conteúdo Expansível - Critérios da Carteira */}
                {expandedCarteira === carteira.id && (
                  <div className="border-t border-gray-200 bg-gray-50">
                    <div className="p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold text-gray-900">Critérios da Carteira</h4>
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedCarteiraForCriterio(carteira);
                              setEditCriterio(null);
                              setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1 });
                              setShowCriterioModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                          >
                            <Plus className="h-4 w-4" />
                            Criar Critério
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCarteiraForCriterio(carteira);
                              setShowAddExistingModal(true);
                            }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 text-sm font-medium"
                          >
                            Adicionar critério existente
                          </button>
                        </div>
                      </div>

                      {/* Lista de Critérios */}
                      {getCriteriosDaCarteira(carteira.id).length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                          <Target className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                          <h5 className="text-lg font-medium text-gray-900 mb-2">Nenhum critério associado</h5>
                          <p className="text-gray-600 mb-4">Esta carteira ainda não possui critérios</p>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setSelectedCarteiraForCriterio(carteira);
                                setEditCriterio(null);
                                setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1 });
                                setShowCriterioModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
                            >
                              <Plus className="h-4 w-4" />
                              Criar Critério
                            </button>
                            <button
                              onClick={() => {
                                setSelectedCarteiraForCriterio(carteira);
                                setShowAddExistingModal(true);
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200"
                            >
                              Adicionar critério existente
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="grid gap-3">
                          {getCriteriosDaCarteira(carteira.id).map(criterio => (
                            <div key={criterio.id} className="flex items-center justify-between p-4 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="p-2 bg-green-100 rounded-xl">
                                  <Target className="h-4 w-4 text-green-600" />
                                </div>
                                <div>
                                  <h5 className="font-medium text-gray-900">{criterio.nome}</h5>
                                  <p className="text-sm text-gray-600">{criterio.descricao || "Sem descrição"}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs text-gray-500">Categoria: {criterio.categoria || "Sem categoria"}</span>
                                    <span className="text-xs text-gray-500">Peso: {criterio.peso}</span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setEditCriterio(criterio);
                                    setCriterioForm({ 
                                      nome: criterio.nome, 
                                      descricao: criterio.descricao || "", 
                                      exemplo_frase: criterio.exemplo_frase || "", 
                                      categoria: criterio.categoria || "", 
                                      peso: criterio.peso || 1
                                    });
                                    setShowCriterioModal(true);
                                  }}
                                  className="inline-flex items-center p-2 border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                                >
                                  <Edit className="h-4 w-4 text-gray-600" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleCriterioDelete(criterio.id);
                                  }}
                                  className="inline-flex items-center p-2 border border-red-300 rounded-full hover:bg-red-50 transition-all duration-200"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Ações da Carteira (sempre visíveis) */}
                <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditCarteira(carteira);
                        setCarteiraForm({ nome: carteira.nome, descricao: carteira.descricao || "", ativo: carteira.ativo });
                        setShowCarteiraModal(true);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-blue-300 text-blue-700 bg-blue-50 rounded-full hover:bg-blue-100 transition-all duration-200"
                    >
                      <Edit className="h-4 w-4 text-blue-700" />
                      Editar
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCarteiraDelete(carteira.id);
                      }}
                      className="inline-flex items-center gap-2 px-3 py-1.5 text-sm border border-red-300 text-red-700 rounded-full hover:bg-red-50 transition-all duration-200"
                    >
                      <Trash2 className="h-4 w-4" />
                      Excluir
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Modal Carteira */}
      {showCarteiraModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-xl">
                  <Folder className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{editCarteira ? "Editar Carteira" : "Nova Carteira"}</h2>
                  <p className="text-sm text-gray-600">Configure os dados da carteira</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleCarteiraSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  name="nome"
                  placeholder="Nome da carteira"
                  value={carteiraForm.nome}
                  onChange={e => setCarteiraForm(f => ({ ...f, nome: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  name="descricao"
                  placeholder="Descrição da carteira"
                  value={carteiraForm.descricao}
                  onChange={e => setCarteiraForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <label className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  name="ativo" 
                  checked={carteiraForm.ativo} 
                  onChange={e => setCarteiraForm(f => ({ ...f, ativo: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Carteira ativa</span>
              </label>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCarteiraModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Critério */}
      {showCriterioModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-xl">
                  <Target className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    {editCriterio ? "Editar Critério" : "Novo Critério"}
                    {selectedCarteiraForCriterio && !editCriterio && (
                      <span className="block text-sm font-normal text-gray-600">
                        para {selectedCarteiraForCriterio.nome}
                      </span>
                    )}
                  </h2>
                  <p className="text-sm text-gray-600">Configure os dados do critério</p>
                </div>
              </div>
            </div>
            
            <form onSubmit={handleCriterioSubmit} className="px-6 py-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Nome</label>
                <input
                  name="nome"
                  placeholder="Nome do critério"
                  value={criterioForm.nome}
                  onChange={e => setCriterioForm(f => ({ ...f, nome: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                <input
                  name="descricao"
                  placeholder="Descrição do critério"
                  value={criterioForm.descricao}
                  onChange={e => setCriterioForm(f => ({ ...f, descricao: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Exemplo de frase</label>
                <input
                  name="exemplo_frase"
                  placeholder="Exemplo de frase"
                  value={criterioForm.exemplo_frase}
                  onChange={e => setCriterioForm(f => ({ ...f, exemplo_frase: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
                <input
                  name="categoria"
                  placeholder="Categoria"
                  value={criterioForm.categoria}
                  onChange={e => setCriterioForm(f => ({ ...f, categoria: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso</label>
                <input
                  name="peso"
                  type="number"
                  min={0}
                  step={0.01}
                  placeholder="Peso"
                  value={criterioForm.peso}
                  onChange={e => setCriterioForm(f => ({ ...f, peso: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowCriterioModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-full hover:bg-gray-50 transition-all duration-200"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-200 disabled:opacity-50"
                >
                  {loading ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Adicionar Critério Existente */}
      {showAddExistingModal && selectedCarteiraForCriterio && (
        <AddExistingCriterioModal
          open={showAddExistingModal}
          carteira={{ id: selectedCarteiraForCriterio.id, nome: selectedCarteiraForCriterio.nome }}
          onClose={() => setShowAddExistingModal(false)}
          onAdded={handleCriterioCreated}
        />
      )}
    </div>
  );
};

export default CarteiraCriterios;