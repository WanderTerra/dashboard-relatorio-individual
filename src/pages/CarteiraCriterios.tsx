import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Plus, Edit, Trash2, CheckCircle, XCircle, Target, Scale, Folder, Link2 } from "lucide-react";
import PageHeader from "../components/PageHeader";

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
  ativo: boolean;
}

// Associação simplificada para visualização (mock)
interface CarteiraCriterio {
  id: number;
  carteira_id: number;
  criterio_id: number;
  ordem?: number;
  peso_especifico?: number;
  criterio?: Criterio;
}

const CarteiraCriterios: React.FC = () => {
  // Carteiras
  const [carteiras, setCarteiras] = useState<Carteira[]>([]);
  const [carteiraForm, setCarteiraForm] = useState({ nome: "", descricao: "", ativo: true });
  const [editCarteira, setEditCarteira] = useState<Carteira | null>(null);
  const [showCarteiraModal, setShowCarteiraModal] = useState(false);

  // Critérios
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [criterioForm, setCriterioForm] = useState({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1, ativo: true });
  const [editCriterio, setEditCriterio] = useState<Criterio | null>(null);
  const [showCriterioModal, setShowCriterioModal] = useState(false);

  // Associação Carteira x Critério (real)
  const [associacoes, setAssociacoes] = useState<CarteiraCriterio[]>([]);
  const [selectedCarteiraId, setSelectedCarteiraId] = useState<number | null>(null);
  const [selectedCriterioId, setSelectedCriterioId] = useState<number | null>(null);
  const [loadingAssociacoes, setLoadingAssociacoes] = useState(false);

  // Carregar dados
  useEffect(() => {
    api.get("/carteiras/").then(res => setCarteiras(res.data));
    api.get("/criterios/").then(res => setCriterios(res.data));
  }, []);

  // Carregar associações ao selecionar carteira
  useEffect(() => {
    if (selectedCarteiraId) {
      setLoadingAssociacoes(true);
      api.get(`/carteira_criterios/carteira/${selectedCarteiraId}`).then(res => {
        setAssociacoes(res.data);
        setLoadingAssociacoes(false);
      }).catch(() => setLoadingAssociacoes(false));
    } else {
      setAssociacoes([]);
    }
  }, [selectedCarteiraId]);

  // CRUD Carteira
  const handleCarteiraSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCarteira) {
      await api.put(`/carteiras/${editCarteira.id}`, carteiraForm);
    } else {
      await api.post("/carteiras/", carteiraForm);
    }
    api.get("/carteiras/").then(res => setCarteiras(res.data));
    setShowCarteiraModal(false);
    setEditCarteira(null);
    setCarteiraForm({ nome: "", descricao: "", ativo: true });
  };
  const handleCarteiraDelete = async (id: number) => {
    if (window.confirm("Excluir carteira?")) {
      await api.delete(`/carteiras/${id}`);
      api.get("/carteiras/").then(res => setCarteiras(res.data));
    }
  };

  // CRUD Critério
  const handleCriterioSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editCriterio) {
      await api.put(`/criterios/${editCriterio.id}`, criterioForm);
    } else {
      await api.post("/criterios/", criterioForm);
    }
    api.get("/criterios/").then(res => setCriterios(res.data));
    setShowCriterioModal(false);
    setEditCriterio(null);
    setCriterioForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1, ativo: true });
  };
  const handleCriterioDelete = async (id: number) => {
    if (window.confirm("Excluir critério?")) {
      await api.delete(`/criterios/${id}`);
      api.get("/criterios/").then(res => setCriterios(res.data));
    }
  };

  // Associação real
  const handleAssociar = async () => {
    if (selectedCarteiraId && selectedCriterioId) {
      try {
        await api.post('/carteira_criterios/', {
          carteira_id: selectedCarteiraId,
          criterio_id: selectedCriterioId
        });
        // Recarregar associações
        const res = await api.get(`/carteira_criterios/carteira/${selectedCarteiraId}`);
        setAssociacoes(res.data);
      } catch (err) {
        alert('Erro ao associar critério à carteira');
      }
    }
  };

  const handleDesassociar = async (carteira_id: number, criterio_id: number) => {
    // Encontrar o id da associação
    const assoc = associacoes.find(a => a.carteira_id === carteira_id && a.criterio_id === criterio_id);
    if (!assoc) return;
    try {
      await api.delete(`/carteira_criterios/${assoc.id}`);
      // Recarregar associações
      const res = await api.get(`/carteira_criterios/carteira/${carteira_id}`);
      setAssociacoes(res.data);
    } catch (err) {
      alert('Erro ao remover associação');
    }
  };

  // Critérios associados à carteira selecionada
  const criteriosDaCarteira = associacoes.map(a => a.criterio_id);

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Carteiras & Critérios" 
        subtitle="Gerencie carteiras, critérios e suas associações"
        actions={
          <div className="flex gap-3">
            <button onClick={() => setShowCarteiraModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium">
              <Plus className="h-4 w-4" />
              Nova Carteira
            </button>
            <button onClick={() => setShowCriterioModal(true)} className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-all duration-200 font-medium">
              <Plus className="h-4 w-4" />
              Novo Critério
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
                          <div className="p-3 bg-blue-100 rounded-xl">
              <Link2 className="h-6 w-6 text-blue-600" />
            </div>
            </div>
          </div>
        </div>

        {/* Gestão de Carteiras */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Folder className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Carteiras</h2>
                <p className="text-sm text-gray-600">Gerencie as carteiras do sistema</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {carteiras.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{c.descricao || "Sem descrição"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.ativo ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditCarteira(c); setCarteiraForm({ nome: c.nome, descricao: c.descricao || "", ativo: c.ativo }); setShowCarteiraModal(true); }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleCarteiraDelete(c.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-full text-red-700 bg-white hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-full hover:bg-blue-700 transition-all duration-200"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Gestão de Critérios */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-xl">
                <Target className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Critérios</h2>
                <p className="text-sm text-gray-600">Gerencie os critérios do sistema</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Categoria</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peso</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {criterios.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{c.nome}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-500">{c.descricao || "Sem descrição"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{c.categoria || "Sem categoria"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{c.peso}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        c.ativo 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {c.ativo ? (
                          <>
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </>
                        ) : (
                          <>
                            <XCircle className="h-3 w-3 mr-1" />
                            Inativo
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => { setEditCriterio(c); setCriterioForm({ nome: c.nome, descricao: c.descricao || "", exemplo_frase: c.exemplo_frase || "", categoria: c.categoria || "", peso: c.peso || 1, ativo: c.ativo }); setShowCriterioModal(true); }}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-full text-gray-700 bg-white hover:bg-gray-50 transition-all duration-200"
                        >
                          <Edit className="h-3 w-3 mr-1" />
                          Editar
                        </button>
                        <button
                          onClick={() => handleCriterioDelete(c.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-full text-red-700 bg-white hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
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
                    <h2 className="text-lg font-bold text-gray-900">{editCriterio ? "Editar Critério" : "Novo Critério"}</h2>
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
                <label className="flex items-center gap-2">
                  <input 
                    type="checkbox" 
                    name="ativo" 
                    checked={criterioForm.ativo} 
                    onChange={e => setCriterioForm(f => ({ ...f, ativo: e.target.checked }))}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Critério ativo</span>
                </label>
                
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
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-full hover:bg-green-700 transition-all duration-200"
                  >
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Associação Carteira x Critério */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 hover:shadow-xl transition-shadow duration-300">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-xl">
                <Link2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-900">Associação Carteira x Critério</h2>
                <p className="text-sm text-gray-600">Associe critérios às carteiras</p>
              </div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Carteira</label>
                <select 
                  className="w-full h-9 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white !text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={selectedCarteiraId || ''} 
                  onChange={e => setSelectedCarteiraId(Number(e.target.value))}
                >
                  <option value="">Selecione a carteira</option>
                  {carteiras.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Critério</label>
                <select 
                  className="w-full h-9 border border-gray-300 rounded-xl px-3 text-sm shadow-sm bg-white !text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  value={selectedCriterioId || ''} 
                  onChange={e => setSelectedCriterioId(Number(e.target.value))}
                >
                  <option value="">Selecione o critério</option>
                  {criterios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleAssociar} 
                  disabled={!selectedCarteiraId || !selectedCriterioId}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Associar
                </button>
              </div>
            </div>
            
            {selectedCarteiraId && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-4">Critérios associados à carteira selecionada:</h4>
                {loadingAssociacoes ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-600 border-t-transparent"></div>
                    <span className="ml-2 text-sm text-gray-600">Carregando...</span>
                  </div>
                ) : criterios.filter(c => criteriosDaCarteira.includes(c.id)).length > 0 ? (
                  <div className="grid gap-3">
                    {criterios.filter(c => criteriosDaCarteira.includes(c.id)).map(c => (
                      <div key={c.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div>
                          <div className="font-medium text-gray-900">{c.nome}</div>
                          <div className="text-sm text-gray-600">{c.categoria || "Sem categoria"}</div>
                        </div>
                        <button
                          onClick={() => handleDesassociar(selectedCarteiraId!, c.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-xs font-medium rounded-full text-red-700 bg-white hover:bg-red-50 transition-all duration-200"
                        >
                          <Trash2 className="h-3 w-3 mr-1" />
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>Nenhum critério associado a esta carteira</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CarteiraCriterios;