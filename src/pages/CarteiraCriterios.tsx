import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
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
    <div>
      <PageHeader 
        title="Carteiras & Critérios" 
        subtitle="Gerencie carteiras, critérios e suas associações"
      />
      <div className="p-6 space-y-8">
        {/* Gestão de Carteiras */}
        <Card>
          <CardHeader>
            <CardTitle>Carteiras</CardTitle>
            <CardDescription>Gerencie as carteiras do sistema</CardDescription>
            <Button onClick={() => setShowCarteiraModal(true)} className="mt-2"><Plus className="w-4 h-4 mr-2" />Nova Carteira</Button>
          </CardHeader>
          <CardContent>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Ativo</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carteiras.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.nome}</td>
                    <td className="px-4 py-2">{c.descricao}</td>
                    <td className="px-4 py-2">{c.ativo ? <Badge variant="default">Sim</Badge> : <Badge variant="secondary">Não</Badge>}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditCarteira(c); setCarteiraForm({ nome: c.nome, descricao: c.descricao || "", ativo: c.ativo }); setShowCarteiraModal(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCarteiraDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCarteiraId(c.id)}><Folder className="w-4 h-4" />Selecionar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Modal Carteira */}
        {showCarteiraModal && (
          <Dialog open={showCarteiraModal} onOpenChange={setShowCarteiraModal}>
            <DialogContent>
              <DialogTitle>{editCarteira ? "Editar Carteira" : "Nova Carteira"}</DialogTitle>
              <form onSubmit={handleCarteiraSubmit} className="flex flex-col gap-3">
                <Input name="nome" placeholder="Nome" value={carteiraForm.nome} onChange={e => setCarteiraForm(f => ({ ...f, nome: e.target.value }))} required />
                <Input name="descricao" placeholder="Descrição" value={carteiraForm.descricao} onChange={e => setCarteiraForm(f => ({ ...f, descricao: e.target.value }))} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="ativo" checked={carteiraForm.ativo} onChange={e => setCarteiraForm(f => ({ ...f, ativo: e.target.checked }))} /> Ativo
                </label>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCarteiraModal(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Gestão de Critérios */}
        <Card>
          <CardHeader>
            <CardTitle>Critérios</CardTitle>
            <CardDescription>Gerencie os critérios do sistema</CardDescription>
            <Button onClick={() => setShowCriterioModal(true)} className="mt-2"><Plus className="w-4 h-4 mr-2" />Novo Critério</Button>
          </CardHeader>
          <CardContent>
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2">Descrição</th>
                  <th className="px-4 py-2">Categoria</th>
                  <th className="px-4 py-2">Peso</th>
                  <th className="px-4 py-2">Ativo</th>
                  <th className="px-4 py-2">Ações</th>
                </tr>
              </thead>
              <tbody>
                {criterios.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium">{c.nome}</td>
                    <td className="px-4 py-2">{c.descricao}</td>
                    <td className="px-4 py-2">{c.categoria}</td>
                    <td className="px-4 py-2">{c.peso}</td>
                    <td className="px-4 py-2">{c.ativo ? <Badge variant="default">Sim</Badge> : <Badge variant="secondary">Não</Badge>}</td>
                    <td className="px-4 py-2 flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => { setEditCriterio(c); setCriterioForm({ nome: c.nome, descricao: c.descricao || "", exemplo_frase: c.exemplo_frase || "", categoria: c.categoria || "", peso: c.peso || 1, ativo: c.ativo }); setShowCriterioModal(true); }}><Edit className="w-4 h-4" /></Button>
                      <Button size="sm" variant="destructive" onClick={() => handleCriterioDelete(c.id)}><Trash2 className="w-4 h-4" /></Button>
                      <Button size="sm" variant="outline" onClick={() => setSelectedCriterioId(c.id)}><Link2 className="w-4 h-4" />Selecionar</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
        {/* Modal Critério */}
        {showCriterioModal && (
          <Dialog open={showCriterioModal} onOpenChange={setShowCriterioModal}>
            <DialogContent>
              <DialogTitle>{editCriterio ? "Editar Critério" : "Novo Critério"}</DialogTitle>
              <form onSubmit={handleCriterioSubmit} className="flex flex-col gap-3">
                <Input name="nome" placeholder="Nome" value={criterioForm.nome} onChange={e => setCriterioForm(f => ({ ...f, nome: e.target.value }))} required />
                <Input name="descricao" placeholder="Descrição" value={criterioForm.descricao} onChange={e => setCriterioForm(f => ({ ...f, descricao: e.target.value }))} />
                <Input name="exemplo_frase" placeholder="Exemplo de frase" value={criterioForm.exemplo_frase} onChange={e => setCriterioForm(f => ({ ...f, exemplo_frase: e.target.value }))} />
                <Input name="categoria" placeholder="Categoria" value={criterioForm.categoria} onChange={e => setCriterioForm(f => ({ ...f, categoria: e.target.value }))} />
                <Input name="peso" type="number" min={0} step={0.01} placeholder="Peso" value={criterioForm.peso} onChange={e => setCriterioForm(f => ({ ...f, peso: Number(e.target.value) }))} />
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="ativo" checked={criterioForm.ativo} onChange={e => setCriterioForm(f => ({ ...f, ativo: e.target.checked }))} /> Ativo
                </label>
                <div className="flex gap-2 justify-end">
                  <Button type="button" variant="outline" onClick={() => setShowCriterioModal(false)}>Cancelar</Button>
                  <Button type="submit">Salvar</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Associação Carteira x Critério */}
        <Card>
          <CardHeader>
            <CardTitle>Associação Carteira x Critério</CardTitle>
            <CardDescription>Associe critérios às carteiras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 mb-4">
              <select className="border rounded px-2 py-1" value={selectedCarteiraId || ''} onChange={e => setSelectedCarteiraId(Number(e.target.value))}>
                <option value="">Selecione a carteira</option>
                {carteiras.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <select className="border rounded px-2 py-1" value={selectedCriterioId || ''} onChange={e => setSelectedCriterioId(Number(e.target.value))}>
                <option value="">Selecione o critério</option>
                {criterios.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <Button onClick={handleAssociar} disabled={!selectedCarteiraId || !selectedCriterioId}>Associar</Button>
            </div>
            {selectedCarteiraId && (
              <div>
                <h4 className="font-semibold mb-2">Critérios associados à carteira selecionada:</h4>
                <ul className="list-disc ml-6">
                  {loadingAssociacoes ? (
                    <li className="text-gray-500">Carregando...</li>
                  ) : criterios.filter(c => criteriosDaCarteira.includes(c.id)).map(c => {
                    const assoc = associacoes.find(a => a.criterio_id === c.id);
                    return (
                      <li key={c.id} className="flex items-center gap-2 mb-1">
                        <span>{c.nome}</span>
                        <Button size="sm" variant="destructive" onClick={() => handleDesassociar(selectedCarteiraId!, c.id)}>Remover</Button>
                      </li>
                    );
                  })}
                  {!loadingAssociacoes && criteriosDaCarteira.length === 0 && <li className="text-gray-500">Nenhum critério associado</li>}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CarteiraCriterios;