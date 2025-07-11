import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "../components/ui/dialog";

interface Criterio {
  id: number;
  nome: string;
  descricao?: string;
  exemplo_frase?: string;
  categoria?: string;
  peso?: number;
  ativo: boolean;
}

const Criterios: React.FC = () => {
  const [criterios, setCriterios] = useState<Criterio[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editCriterio, setEditCriterio] = useState<Criterio | null>(null);
  const [form, setForm] = useState({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1, ativo: true });

  const fetchCriterios = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/criterios/");
      setCriterios(res.data);
    } catch (err: any) {
      setError("Erro ao carregar critérios");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCriterios();
  }, []);

  const handleOpenModal = (criterio?: Criterio) => {
    if (criterio) {
      setEditCriterio(criterio);
      setForm({
        nome: criterio.nome,
        descricao: criterio.descricao || "",
        exemplo_frase: criterio.exemplo_frase || "",
        categoria: criterio.categoria || "",
        peso: criterio.peso || 1,
        ativo: criterio.ativo,
      });
    } else {
      setEditCriterio(null);
      setForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1, ativo: true });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditCriterio(null);
    setForm({ nome: "", descricao: "", exemplo_frase: "", categoria: "", peso: 1, ativo: true });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox" && e.target instanceof HTMLInputElement) {
      setForm((prev) => ({ ...prev, [name]: e.target.checked }));
    } else if (name === "peso") {
      setForm((prev) => ({ ...prev, peso: Number(value) }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editCriterio) {
        await api.put(`/criterios/${editCriterio.id}`, form);
      } else {
        await api.post("/criterios/", form);
      }
      fetchCriterios();
      handleCloseModal();
    } catch (err: any) {
      setError("Erro ao salvar critério");
    }
    setLoading(false);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Tem certeza que deseja excluir este critério?")) return;
    setLoading(true);
    try {
      await api.delete(`/criterios/${id}`);
      fetchCriterios();
    } catch (err: any) {
      setError("Erro ao excluir critério");
    }
    setLoading(false);
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">Critérios</h1>
        <Button onClick={() => handleOpenModal()}>Novo Critério</Button>
      </div>
      {error && <div className="text-red-500 mb-2">{error}</div>}
      {loading && <div>Carregando...</div>}
      <table className="min-w-full bg-white shadow rounded">
        <thead>
          <tr>
            <th className="p-2 text-left">Nome</th>
            <th className="p-2 text-left">Descrição</th>
            <th className="p-2 text-left">Exemplo</th>
            <th className="p-2 text-left">Categoria</th>
            <th className="p-2 text-left">Peso</th>
            <th className="p-2 text-left">Ativo</th>
            <th className="p-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {criterios.map((c) => (
            <tr key={c.id}>
              <td className="p-2">{c.nome}</td>
              <td className="p-2">{c.descricao}</td>
              <td className="p-2">{c.exemplo_frase}</td>
              <td className="p-2">{c.categoria}</td>
              <td className="p-2">{c.peso}</td>
              <td className="p-2">{c.ativo ? "Sim" : "Não"}</td>
              <td className="p-2 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleOpenModal(c)}>
                  Editar
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDelete(c.id)}>
                  Excluir
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Modal de criação/edição */}
      {showModal && (
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogTitle>{editCriterio ? "Editar Critério" : "Novo Critério"}</DialogTitle>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <Input
                name="nome"
                placeholder="Nome"
                value={form.nome}
                onChange={handleChange}
                required
              />
              <Input
                name="descricao"
                placeholder="Descrição"
                value={form.descricao}
                onChange={handleChange}
              />
              <Input
                name="exemplo_frase"
                placeholder="Exemplo de frase"
                value={form.exemplo_frase}
                onChange={handleChange}
              />
              <Input
                name="categoria"
                placeholder="Categoria"
                value={form.categoria}
                onChange={handleChange}
              />
              <Input
                name="peso"
                type="number"
                min={0}
                step={0.01}
                placeholder="Peso"
                value={form.peso}
                onChange={handleChange}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={form.ativo}
                  onChange={handleChange}
                />
                Ativo
              </label>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={handleCloseModal}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  Salvar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default Criterios; 